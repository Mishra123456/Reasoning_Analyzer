from app.llm.client import LocalLLMClient
from app.domain.generic import GenericAnalyzer

class MistakeAnalyzer:
    def __init__(self, system_prompt):
        self.llm = LocalLLMClient()
        self.domain = GenericAnalyzer()
        self.system_prompt = system_prompt

    def analyze(self, question, answer):
        user_prompt = self.domain.format_input(question, answer)
        full_prompt = f"{self.system_prompt}\n\n{user_prompt}"
        return self.llm.generate(full_prompt)