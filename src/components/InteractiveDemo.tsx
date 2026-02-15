import { useState } from "react";

type Mode = "education" | "interview" | "research";

interface AnalysisResult {
  mistakeType: string;
  reasoningPattern: string;
  explanation: string;
  additionalFields?: Record<string, any>;
}

const presets: Record<string, { problem: string; reasoning: string; mode: Mode; result: AnalysisResult }> = {
  education: {
    problem: "A train travels 120 km in 2 hours. If it speeds up by 50%, how long does the new journey take?",
    reasoning: "Original speed is 60 km/h. 50% faster means 90 km/h. So time = 120/90 = 1.5 hours. Wait, but I think speeding up by 50% means adding 50 km/h, so 110 km/h...",
    mode: "education",
    result: {
      mistakeType: "Percentage misinterpretation",
      reasoningPattern: "The reasoning correctly identifies the base speed but then second-guesses the meaning of 'speeds up by 50%', conflating percentage increase with absolute addition.",
      explanation: "The initial approach was sound. The error occurs when re-interpreting '50% faster' as an absolute value (+50 km/h) rather than a relative percentage of the original speed. This is a common cognitive pattern where uncertainty leads to overcorrection.",
    },
  },
  interview: {
    problem: "Design a system that can handle 10,000 concurrent WebSocket connections with real-time updates.",
    reasoning: "I would use a single Node.js server since it handles async well. Each connection would store state in memory. For scaling, I'd just add more RAM.",
    mode: "interview",
    result: {
      mistakeType: "Scalability blind spot",
      reasoningPattern: "The candidate correctly identifies Node.js event-loop strengths but assumes vertical scaling (more RAM) solves horizontal scaling problems.",
      explanation: "Single-server architecture creates a single point of failure. In-memory state is lost on restart and cannot be shared across instances. The reasoning lacks consideration of load balancing, state externalization, and graceful degradation under peak load.",
    },
  },
  research: {
    problem: "Study claims: 'Students who use AI tools score 15% higher on exams.'",
    reasoning: "AI tools improve learning outcomes. The 15% improvement is significant. Schools should adopt AI tools immediately based on this evidence.",
    mode: "research",
    result: {
      mistakeType: "Correlation-causation conflation",
      reasoningPattern: "Jumps from observational correlation to causal claim, then to prescriptive action, without examining confounding variables or study methodology.",
      explanation: "The reasoning exhibits confirmation bias by accepting the headline claim without questioning selection bias (do higher-performing students gravitate toward AI tools?), study design (was it randomized?), or alternative explanations. The leap to policy recommendation compounds the initial analytical gap.",
    },
  },
};

const InteractiveDemo = () => {
  const [problem, setProblem] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [mode, setMode] = useState<Mode>("education");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultKey, setResultKey] = useState(0);

  const loadPreset = (key: string) => {
    const preset = presets[key];
    setProblem(preset.problem);
    setReasoning(preset.reasoning);
    setMode(preset.mode);
    setResult(null);
  };

  const analyze = async () => {
    if (!problem.trim() || !reasoning.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem,
          reasoning,
          mode: mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      setResult({
        mistakeType: data.mistake_type || "Unknown Error",
        reasoningPattern: data.reasoning_pattern || "Analysis incomplete",
        explanation: data.explanation || (data.raw_response ? `Raw Output: ${data.raw_response}` : "No explanation provided."),
        additionalFields: data.additional_fields
      });
      setResultKey((k) => k + 1);

    } catch (error) {
      console.error("Analysis failed:", error);
      setResult({
        mistakeType: "System Error",
        reasoningPattern: "Connection Failed",
        explanation: "Could not connect to the analysis server. Please ensure the backend is running.",
      });
      setResultKey((k) => k + 1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const modes: { key: Mode; label: string }[] = [
    { key: "education", label: "Education" },
    { key: "interview", label: "Interview" },
    { key: "research", label: "Research" },
  ];

  return (
    <section id="demo" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12">
          <h2 className="text-3xl font-bold">Interactive Demo</h2>
          <p className="mt-2 text-muted-foreground">
            Submit a problem and your reasoning to receive structured analysis.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* LEFT PANEL */}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Problem statement
              </label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe the problem..."
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Your reasoning
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Explain your thought process..."
                rows={4}
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Mode
              </label>
              <div className="inline-flex rounded-lg border border-border bg-muted p-1">
                {modes.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`relative rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-out ${mode === m.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={isAnalyzing || !problem.trim() || !reasoning.trim()}
              className="hover-lift rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Reasoning"}
            </button>

            <div className="flex flex-wrap gap-2 pt-2">
              {Object.keys(presets).map((key) => (
                <button
                  key={key}
                  onClick={() => loadPreset(key)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-foreground/20 hover:-translate-y-0.5"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)} Example
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm overflow-y-auto max-h-[600px]">
            {result ? (
              <div key={resultKey} className="space-y-6">
                <div className="animate-slide-up" style={{ animationDelay: "0ms" }}>
                  <AnalysisField label="Mistake Type" value={result.mistakeType} mono />
                </div>
                <div className="opacity-0 animate-slide-up" style={{ animationDelay: "80ms" }}>
                  <AnalysisField label="Reasoning Pattern" value={result.reasoningPattern} />
                </div>
                <div className="opacity-0 animate-slide-up" style={{ animationDelay: "160ms" }}>
                  <AnalysisField label="Explanation" value={result.explanation} />
                </div>
                {result.additionalFields && Object.entries(result.additionalFields).map(([key, value], index) => (
                  <div key={key} className="opacity-0 animate-slide-up" style={{ animationDelay: `${240 + index * 80}ms` }}>
                    <AnalysisField label={key} value={String(value)} />
                  </div>
                ))}

                <div
                  className="rounded-md bg-muted px-4 py-2.5 text-xs text-muted-foreground opacity-0 animate-fade-in"
                  style={{ animationDelay: "400ms" }}
                >
                  No answers or calculations provided. Analysis focuses on reasoning structure only.
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Analysis output will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const AnalysisField = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div>
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {label}
    </span>
    <p
      className={`text-sm leading-relaxed ${mono
        ? "font-mono bg-code rounded-md px-3 py-2.5 text-code-foreground font-medium"
        : "text-foreground"
        }`}
    >
      {value}
    </p>
  </div>
);

export default InteractiveDemo;
