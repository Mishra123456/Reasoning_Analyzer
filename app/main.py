from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api_models import AnalysisRequest, AnalysisResponse
from app.orchestrator.analyzer import MistakeAnalyzer
from app.orchestrator.validator import validate_output
import re
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load prompts
PROMPTS = {}
try:
    with open("prompts/system_prompt.txt", "r", encoding="utf-8") as f:
        PROMPTS["education"] = f.read()
    with open("prompts/system_prompt_interview.txt", "r", encoding="utf-8") as f:
        PROMPTS["interview"] = f.read()
    with open("prompts/system_prompt_research.txt", "r", encoding="utf-8") as f:
        PROMPTS["research"] = f.read()
except FileNotFoundError as e:
    print(f"Warning: Prompt file not found: {e}")
    # Fallback
    DEFAULT_PROMPT = "You are an AI tutor helping students understand their mistakes."
    PROMPTS = {k: DEFAULT_PROMPT for k in ["education", "interview", "research"]}

# We need to instantiate the analyzer dynamically or update it per request.
# Since the analyzer holds the system prompt, we'll just instantiate it inside the endpoint 
# or helper function for now, or make the analyzer stateless regarding the prompt.
# Looking at analyzer.py, it takes system_prompt in __init__. 
# Let's re-instantiate it per request for simplicity (it's lightweight).

def parse_llm_output(output_text: str) -> dict:
    """
    Parses the structured output from the LLM into a dictionary.
    Supports multiple formats by looking for "Key:\nValue" patterns.
    """
    result = {
        "mistake_type": "Unknown",
        "reasoning_pattern": "Analysis failed",
        "explanation": output_text,
        "additional_fields": {} 
    }

    # regex to find headers like "Mistake Type:" or "Reasoning Error Category:"
    # We look for a line starting with words and a colon, followed by content.
    
    # Strategy: Split by double newlines or identify known keys? 
    # The prompts use "Key:\n- Value" or "Key:\nValue".
    
    # Let's try to map common keys to our standard schema, and put everything else in 'additional_fields'.
    
    parsed_sections = {}
    
    # Pattern: Line(s) acting as Header (ending in :) followed by content until next Header.
    # We can use a scanner approach.
    lines = output_text.splitlines()
    current_key = None
    current_content = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line is a header (e.g., "Mistake Type:", "Why This Happens:")
        # We assume headers don't start with "- " and end with ":"
        if line.endswith(":") and not line.startswith("-") and len(line) < 50:
            if current_key:
                parsed_sections[current_key] = "\n".join(current_content).strip()
            current_key = line[:-1] # Remove colon
            current_content = []
        else:
            current_content.append(line)
            
    if current_key:
        parsed_sections[current_key] = "\n".join(current_content).strip()

    # MAPPINGS
    # Define mapping from possible LLM keys to our API schema
    key_mapping = {
        # Standard / Education
        "Mistake Type": "mistake_type",
        "Error Pattern Tag": "reasoning_pattern",
        "What Went Wrong": "explanation",
        
        # Research
        "Reasoning Error Category": "mistake_type",
        "Cognitive Pattern": "reasoning_pattern",
        "Research Interpretation": "explanation",
        
        # Interview
        # (Uses Mistake Type/Error Pattern Tag as well usually, or we can map others)
    }

    # Populate result
    for llm_key, value in parsed_sections.items():
        mapped_key = key_mapping.get(llm_key)
        if mapped_key:
            # If we already have something (e.g. from multiple explanations), append?
            # For explanation, we might want to combine "What Went Wrong" and "Why This Happens"
            if mapped_key == "explanation" and result["explanation"] != output_text:
                 result["explanation"] += f"\n\n**{llm_key}**:\n{value}"
            elif mapped_key == "explanation":
                 result["explanation"] = value # First explanation field found
            else:
                result[mapped_key] = value
        else:
            # Keep track of unmapped fields to show them too
            result["additional_fields"][llm_key] = value

    # Append generic fields to explanation if they are relevant but not strictly mapped?
    # Or just return them in raw_response/structure.
    # The user wants "everything I asked in the prompt".
    # We will pass 'additional_fields' in the response.
    
    # Special handling for "Why This Happens" etc to append to explanation if not mapped
    # (Actually, let's just dump everything into additional_fields if processed by frontend)
    
    return result

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_reasoning(request: AnalysisRequest):
    try:
        # Select prompt
        mode = request.mode.lower()
        if mode not in PROMPTS:
            mode = "education"
        
        system_prompt = PROMPTS[mode]
        
        # Instantiate analyzer with specific prompt
        analyzer = MistakeAnalyzer(system_prompt)
        
        raw_output = analyzer.analyze(request.problem, request.reasoning)
        
        # Validate output logic (e.g. check for safety violations)
        validation_msg = validate_output(raw_output)
        
        if "The response crossed into solving territory" in validation_msg:
             return AnalysisResponse(
                mistake_type="Safety Violation",
                reasoning_pattern="Attempted to solve",
                explanation=validation_msg,
                raw_response=raw_output,
                additional_fields={}
            )

        parsed_data = parse_llm_output(raw_output)
        
        return AnalysisResponse(
            mistake_type=parsed_data["mistake_type"],
            reasoning_pattern=parsed_data["reasoning_pattern"],
            explanation=parsed_data["explanation"],
            raw_response=raw_output,
            additional_fields=parsed_data["additional_fields"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)