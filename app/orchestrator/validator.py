from app.safety.guardrails import is_safe

def validate_output(text):
    if not text:
        return "No response generated. Try rephrasing."

    if not is_safe(text):
        return (
            "The response crossed into solving territory.\n"
            "The system is designed to explain mistakes only."
        )

    return text
    