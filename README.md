# Reasoning Mistake Analyzer

An AI-powered system that **explains why reasoning is wrong — without ever giving the answer**. It analyzes cognitive mistakes, identifies error patterns, and helps users develop better thinking habits.

> This tool is designed for education, interview evaluation, and cognitive research. It never solves, calculates, or reveals correct answers.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Architecture Diagram](#system-architecture-diagram)
- [Model Details](#model-details)
- [Pipeline Flow](#pipeline-flow)
- [Analysis Modes](#analysis-modes)
- [Safety & Guardrails](#safety--guardrails)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)

---

## Architecture Overview

The application follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                    │
│          (Vite + TypeScript + Tailwind CSS)          │
│                                                     │
│   ┌───────────┐  ┌──────────┐  ┌────────────────┐  │
│   │  Problem   │  │ Reasoning│  │  Mode Selector │  │
│   │  Input     │  │  Input   │  │ (Edu/Int/Res)  │  │
│   └─────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│         └──────────────┴────────────────┘            │
│                        │ POST /analyze               │
└────────────────────────┼────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│                  FastAPI Backend                     │
│                                                     │
│   ┌────────────────────────────────────────────┐    │
│   │         Mode-Based Prompt Selection         │    │
│   │  education │ interview │ research           │    │
│   └──────────────────┬─────────────────────────┘    │
│                      ▼                               │
│   ┌────────────────────────────────────────────┐    │
│   │         GenericAnalyzer (Domain Layer)       │    │
│   │  • Sanitizes math symbols (=, +, -, *, /)   │    │
│   │  • Formats question + answer into prompt     │    │
│   └──────────────────┬─────────────────────────┘    │
│                      ▼                               │
│   ┌────────────────────────────────────────────┐    │
│   │         MistakeAnalyzer (Orchestrator)       │    │
│   │  • Combines system prompt + user prompt      │    │
│   │  • Calls LLM client                          │    │
│   └──────────────────┬─────────────────────────┘    │
│                      ▼                               │
│   ┌────────────────────────────────────────────┐    │
│   │         LocalLLMClient (LLM Layer)          │    │
│   │  • Runs Ollama via subprocess                │    │
│   │  • Model: qwen2.5:3b                         │    │
│   │  • Pipes prompt → stdin, reads stdout        │    │
│   └──────────────────┬─────────────────────────┘    │
│                      ▼                               │
│   ┌────────────────────────────────────────────┐    │
│   │         Safety Guardrails Pipeline          │    │
│   │  • Forbidden phrase detection                │    │
│   │  • Reasoning indicator validation            │    │
│   │  • Output validator gate                     │    │
│   └──────────────────┬─────────────────────────┘    │
│                      ▼                               │
│   ┌────────────────────────────────────────────┐    │
│   │         Dynamic Response Parser             │    │
│   │  • Header:Content section scanning           │    │
│   │  • Mode-aware key mapping                    │    │
│   │  • Additional fields extraction              │    │
│   └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Model Details

| Property              | Value                                        |
|----------------------|----------------------------------------------|
| **Model**            | `qwen2.5:3b` (Qwen 2.5, 3 billion params)   |
| **Runtime**          | [Ollama](https://ollama.ai) (local inference)|
| **Max Tokens**       | 400                                          |
| **Interface**        | Subprocess via `stdin`/`stdout` pipe         |
| **Quantization**     | Default Ollama quantization (Q4_K_M)         |
| **Hardware Req.**    | CPU-only capable, ~2GB RAM minimum           |

### Why Qwen 2.5:3b?

- **Small footprint**: Runs on consumer hardware without a GPU
- **Strong reasoning**: Competitive instruction-following at 3B scale
- **Fast inference**: Low latency for interactive use
- **Local privacy**: No data leaves the machine

### LLM Client Implementation

The `LocalLLMClient` (`app/llm/client.py`) communicates with Ollama using subprocess piping:

```python
class LocalLLMClient:
    def generate(self, prompt: str) -> str:
        process = subprocess.Popen(
            ["ollama", "run", "qwen2.5:3b"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True, encoding="utf-8", errors="ignore"
        )
        output, _ = process.communicate(prompt)
        return output.strip() if output else ""
```

---

## Pipeline Flow

Every analysis request passes through a **5-stage pipeline**:

```
User Input → Sanitize → Prompt Assembly → LLM Inference → Safety Check → Parse & Respond
```

### Stage 1: Input Sanitization (`app/domain/generic.py`)

Mathematical symbols are replaced with words to prevent the LLM from being triggered into solving:

| Symbol | Replacement     |
|--------|----------------|
| `=`    | `equals`       |
| `+`    | `plus`         |
| `-`    | `minus`        |
| `*`    | `times`        |
| `/`    | `divided by`   |

### Stage 2: Prompt Assembly (`app/orchestrator/analyzer.py`)

The `MistakeAnalyzer` combines the mode-specific system prompt with the sanitized user input:

```
[System Prompt (mode-specific)]

Question:
{sanitized_question}

User Answer:
{sanitized_answer}

Analyze the reasoning mistake without solving or calculating.
```

### Stage 3: LLM Inference (`app/llm/client.py`)

The assembled prompt is piped to `ollama run qwen2.5:3b` and the raw text output is captured.

### Stage 4: Safety Validation (`app/safety/guardrails.py` + `app/orchestrator/validator.py`)

A two-layer safety check ensures the model never solves problems:

**Forbidden Patterns** (triggers rejection):
- `"the answer is"`, `"the correct answer is"`
- `"equals"`, `" = "`, `"solution is"`, `"final answer"`

**Reasoning Indicators** (confirms safe output):
- `"assumed"`, `"intuition"`, `"verification"`, `"reasoning"`
- `"thinking"`, `"confidence"`, `"mistake"`, `"error"`, `"overconfidence"`

If a forbidden pattern is detected → response is **blocked** with a safety violation message.

### Stage 5: Dynamic Response Parsing (`app/main.py`)

The raw LLM output is parsed using a **header-scanning algorithm** that:
1. Identifies section headers (lines ending with `:`)
2. Maps known headers to standardized API fields
3. Captures all unmapped headers as `additional_fields`

**Key Mapping** (mode-aware):

| LLM Output Header           | API Field            | Mode       |
|-----------------------------|---------------------|------------|
| `Mistake Type`              | `mistake_type`      | Education  |
| `Error Pattern Tag`         | `reasoning_pattern` | Education  |
| `What Went Wrong`           | `explanation`       | Education  |
| `Reasoning Error Category`  | `mistake_type`      | Research   |
| `Cognitive Pattern`         | `reasoning_pattern` | Research   |
| `Research Interpretation`   | `explanation`       | Research   |

---

## Analysis Modes

The system supports **three distinct analysis personas**, each driven by a dedicated system prompt.

### 🎓 Education Mode (`system_prompt.txt`)

**Role**: AI Tutor — explains reasoning mistakes to help learning

**Output Structure**:
| Field                        | Description                                   |
|-----------------------------|-----------------------------------------------|
| Mistake Type                | Conceptual / Logical / Assumption / Misinterpretation / Overconfidence |
| Error Pattern Tag           | Short label (e.g., Rushing, Overconfidence)    |
| Confidence Level            | High / Medium / Low                            |
| Consistency Check           | Yes / Partially / No                           |
| What Went Wrong             | Explanation of the flawed reasoning            |
| Why This Happens            | Cognitive cause of the error                   |
| How To Rethink              | General mindset-focused suggestions            |
| What Would Have Prevented   | Habit or mindset that could prevent the error  |
| Reflection Question         | One question encouraging self-reflection       |

---

### 🏢 Interview Mode (`system_prompt_interview.txt`)

**Role**: AI Interviewer — evaluates reasoning quality neutrally

**Rules**: No teaching, coaching, encouraging, or advice. All output is framed as neutral evaluation.

**Output Structure**:
| Field                        | Description                                   |
|-----------------------------|-----------------------------------------------|
| Mistake Type                | Same categories as Education mode              |
| Error Pattern Tag           | Short behavioral label                         |
| Confidence Level            | High / Medium / Low                            |
| Consistency Check           | Yes / Partially / No                           |
| Interviewer Assessment      | Neutral observation of reasoning focus          |
| Risk Signals                | Descriptive observations about reasoning risks |

---

### 🔬 Research Mode (`system_prompt_research.txt`)

**Role**: AI Researcher — analyzes reasoning errors as cognitive patterns

**Rules**: Impersonal, analytical tone. Describes patterns, not individuals. No evaluative language.

**Output Structure**:
| Field                        | Description                                   |
|-----------------------------|-----------------------------------------------|
| Reasoning Error Category    | e.g., Overconfidence Bias, Premature Closure   |
| Cognitive Pattern           | Abstract description of the reasoning pattern  |
| Confidence in Classification| High / Medium / Low                            |
| Agreement with User Analysis| Yes / Partially / No                           |
| Research Interpretation     | Abstract, general explanation of the error     |
| Why This Pattern Occurs     | Cognitive or situational factors                |
| Broader Implications        | What this suggests about human reasoning       |
| Related Cognitive Biases    | 1–3 related biases or concepts                 |

---

## Safety & Guardrails

The system enforces a **strict no-solving policy** at multiple layers:

```
┌──────────────────────────────────────────┐
│           Safety Architecture            │
│                                          │
│  Layer 1: System Prompt Instructions     │
│  ├── "Do NOT give the correct answer"    │
│  ├── "Do NOT solve the problem"          │
│  ├── "Do NOT compute or calculate"       │
│  └── Numeric Safety Rule                 │
│                                          │
│  Layer 2: Input Sanitization             │
│  └── Math symbols → words               │
│                                          │
│  Layer 3: Output Guardrails              │
│  ├── Forbidden pattern scanning          │
│  ├── Reasoning indicator validation      │
│  └── Output validator gate               │
│                                          │
│  Layer 4: Config-Level Forbidden Phrases │
│  └── Centralized in app/config.py        │
└──────────────────────────────────────────┘
```

---

## API Reference

### `POST /analyze`

Analyze a user's reasoning about a given problem.

**Request Body** (`AnalysisRequest`):
```json
{
  "problem": "A train travels 120 km in 2 hours...",
  "reasoning": "I think the speed is 60 km/h, but...",
  "mode": "education"
}
```

| Field       | Type     | Required | Description                                |
|------------|----------|----------|--------------------------------------------|
| `problem`  | `string` | Yes      | The problem statement                      |
| `reasoning`| `string` | Yes      | The user's reasoning/answer                |
| `mode`     | `string` | No       | `education` (default), `interview`, `research` |

**Response Body** (`AnalysisResponse`):
```json
{
  "mistake_type": "Misinterpretation",
  "reasoning_pattern": "Overconfidence",
  "explanation": "The reasoning conflates percentage increase with...",
  "raw_response": "Full LLM output text...",
  "additional_fields": {
    "Confidence Level": "High",
    "How To Rethink": "Consider re-reading the problem statement..."
  }
}
```

| Field               | Type     | Description                                |
|--------------------|----------|--------------------------------------------|
| `mistake_type`     | `string` | Primary error classification               |
| `reasoning_pattern`| `string` | Behavioral pattern tag                     |
| `explanation`      | `string` | Detailed explanation of the error          |
| `raw_response`     | `string` | Full unprocessed LLM output               |
| `additional_fields`| `object` | All other structured fields from the LLM   |

---

## Project Structure

```
reasoning-insights-main/
│
├── app/                          # Python backend
│   ├── main.py                   # FastAPI app, routing, response parsing
│   ├── api_models.py             # Pydantic request/response schemas
│   ├── config.py                 # Model name, max tokens, forbidden phrases
│   ├── domain/
│   │   └── generic.py            # Input sanitization & formatting
│   ├── llm/
│   │   └── client.py             # Ollama subprocess LLM client
│   ├── orchestrator/
│   │   ├── analyzer.py           # Prompt assembly & LLM orchestration
│   │   └── validator.py          # Output validation gate
│   └── safety/
│       └── guardrails.py         # Forbidden pattern & reasoning indicator checks
│
├── prompts/                      # System prompt files
│   ├── system_prompt.txt         # Education mode prompt
│   ├── system_prompt_interview.txt # Interview mode prompt
│   └── system_prompt_research.txt  # Research mode prompt
│
├── src/                          # React frontend
│   ├── components/
│   │   ├── InteractiveDemo.tsx   # Main analysis UI with mode selector
│   │   ├── Hero.tsx              # Landing hero section
│   │   ├── ModesOverview.tsx     # Mode comparison cards
│   │   ├── WhyDifferent.tsx      # Value proposition section
│   │   └── SiteFooter.tsx        # Footer with GitHub link
│   └── pages/
│       └── Index.tsx             # Page composition & nav bar
│
├── public/                       # Static assets
│   └── favicon.png               # App icon
│
├── index.html                    # Entry HTML with SEO metadata
├── requirements.txt              # Python dependencies
├── package.json                  # Node.js dependencies
├── start_app.bat                 # Windows startup script
└── README.md                     # This file
```

---

## Tech Stack

| Layer     | Technology                                             |
|-----------|-------------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui   |
| Backend   | FastAPI, Pydantic, Uvicorn                             |
| LLM       | Qwen 2.5:3b via Ollama (local inference)               |
| Transport | REST API (JSON over HTTP)                              |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Python** ≥ 3.9 and **pip**
- **Ollama** installed — [Download](https://ollama.ai)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Mishra123456/Reasoning_Analyzer.git
cd Reasoning_Analyzer

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Pull the LLM model
ollama pull qwen2.5:3b
```

### Running the App

**Option A: Use the startup script (Windows)**
```
start_app.bat
```

**Option B: Manual start**
```bash
# Terminal 1 — Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
npm run dev
```

Then open `http://localhost:8080` in your browser.

---

## License

This project is provided as-is for educational and research purposes.
