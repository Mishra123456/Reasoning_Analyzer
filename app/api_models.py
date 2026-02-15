from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class AnalysisRequest(BaseModel):
    problem: str
    reasoning: str
    mode: str = "education"  # education, interview, research

class AnalysisResponse(BaseModel):
    mistake_type: str
    reasoning_pattern: str
    explanation: str
    raw_response: Optional[str] = None
    additional_fields: Dict[str, Any] = Field(default_factory=dict)
