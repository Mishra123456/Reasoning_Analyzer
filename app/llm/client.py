# import subprocess
# from app.config import MODEL_NAME

# class LocalLLMClient:
#     def generate(self, prompt: str) -> str:
#         result = subprocess.run(
#         ["ollama", "run", MODEL_NAME],
#         input=prompt,
#         capture_output=True,
#         encoding="utf-8",
#         errors="ignore"
# )

import subprocess
from app.config import MODEL_NAME

class LocalLLMClient:
    def generate(self, prompt: str) -> str:
        process = subprocess.Popen(
            ["ollama", "run", MODEL_NAME],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,   # ignore stderr completely
            text=True,
            encoding="utf-8",
            errors="ignore"
        )

        output, _ = process.communicate(prompt)
        return output.strip() if output else ""