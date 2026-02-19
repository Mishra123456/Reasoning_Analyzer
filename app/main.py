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
    Supports both "Key:\nValue" (multi-line) and "Key: Value" (inline) formats.
    """
    result = {
        "mistake_type": "Unknown",
        "reasoning_pattern": "Analysis failed",
        "explanation": output_text,
        "additional_fields": {} 
    }

    # All known section headers across all modes
    KNOWN_HEADERS = [
        # Education
        "Mistake Type", "Error Pattern Tag", "Confidence Level",
        "Consistency Check", "What Went Wrong", "Why This Happens",
        "How To Rethink", "What Would Have Prevented This",
        "What Would Have Prevented", "Reflection Question",
        # Research
        "Reasoning Error Category", "Cognitive Pattern",
        "Confidence in Classification", "Agreement with User Analysis",
        "Research Interpretation", "Why This Pattern Occurs",
        "Broader Implications", "Related Cognitive Biases",
        # Interview
        "Interviewer Assessment", "Risk Signals",
    ]
    
    parsed_sections = {}
    lines = output_text.splitlines()
    current_key = None
    current_content = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        found_header = None
        remaining_value = None
        
        # Check if this line starts with a known header
        for header in KNOWN_HEADERS:
            # Match "Header:" or "Header: value"
            if stripped.startswith(header + ":"):
                found_header = header
                remaining_value = stripped[len(header) + 1:].strip()
                # Remove leading "- " from value if present
                if remaining_value.startswith("- "):
                    remaining_value = remaining_value[2:].strip()
                break
        
        # Also match generic "Something:" at end of line (for unknown headers)
        if not found_header and stripped.endswith(":") and not stripped.startswith("-") and len(stripped) < 50:
            found_header = stripped[:-1]
            remaining_value = ""
        
        if found_header:
            # Save previous section
            if current_key:
                parsed_sections[current_key] = "\n".join(current_content).strip()
            current_key = found_header
            current_content = [remaining_value] if remaining_value else []
        else:
            # Remove leading "- " from content lines
            if stripped.startswith("- "):
                stripped = stripped[2:]
            current_content.append(stripped)
            
    if current_key:
        parsed_sections[current_key] = "\n".join(current_content).strip()

    # MAPPINGS from LLM keys to API schema
    key_mapping = {
        # Education
        "Mistake Type": "mistake_type",
        "Error Pattern Tag": "reasoning_pattern",
        "What Went Wrong": "explanation",
        # Research
        "Reasoning Error Category": "mistake_type",
        "Cognitive Pattern": "reasoning_pattern",
        "Research Interpretation": "explanation",
    }

    # Populate result
    for llm_key, value in parsed_sections.items():
        mapped_key = key_mapping.get(llm_key)
        if mapped_key:
            if mapped_key == "explanation" and result["explanation"] != output_text:
                 result["explanation"] += f"\n\n**{llm_key}**:\n{value}"
            elif mapped_key == "explanation":
                 result["explanation"] = value
            else:
                result[mapped_key] = value
        else:
            result["additional_fields"][llm_key] = value

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