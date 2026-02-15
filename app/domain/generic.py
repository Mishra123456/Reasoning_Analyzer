class GenericAnalyzer:
    def format_input(self, question, answer):
        def clean(text):
            return (
                text.replace("=", " equals ")
                    .replace("+", " plus ")
                    .replace("-", " minus ")
                    .replace("*", " times ")
                    .replace("/", " divided by ")
                    .strip()
            )

        question = clean(question)
        answer = clean(answer)

        return f"""
Question:
{question}

User Answer:
{answer}

Analyze the reasoning mistake without solving or calculating.
"""