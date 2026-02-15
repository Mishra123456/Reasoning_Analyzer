def is_safe(text: str) -> bool:
    if not text:
        return False

    lowered = text.lower()

    # Explicit solving patterns (ONLY these are dangerous)
    forbidden_patterns = [
        "the answer is",
        "the correct answer is",
        "equals",
        " = ",
        "solution is",
        "final answer"
    ]

    for p in forbidden_patterns:
        if p in lowered:
            return False

    # If it's clearly talking about thinking/reasoning, allow it
    reasoning_indicators = [
        "assumed",
        "intuition",
        "verification",
        "reasoning",
        "thinking",
        "confidence",
        "mistake",
        "error",
        "overconfidence"
    ]

    if any(word in lowered for word in reasoning_indicators):
        return True

    # Default: allow (be permissive, not paranoid)
    return True