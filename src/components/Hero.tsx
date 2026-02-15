import { useEffect, useRef } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";

const steps = ["Problem", "Reasoning", "Analysis", "Insight"];

const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.style.opacity = "1";
  }, []);

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToModes = () => {
    document.getElementById("modes")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="border-b border-border">
      <div
        ref={ref}
        className="mx-auto max-w-4xl px-6 py-28 text-center opacity-0 animate-fade-up"
      >
        <h1 className="text-5xl font-extrabold leading-[1.08] sm:text-6xl lg:text-[3.5rem]">
          AI That Explains Why
          <br />
          Reasoning Fails
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Analyze thinking mistakes without revealing answers.
          <br />
          Built for education, interviews, and research.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={scrollToDemo}
            className="hover-lift inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Try the Demo
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={scrollToModes}
            className="hover-lift inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            View Modes
          </button>
        </div>

        <div
          className="mt-20 flex items-center justify-center gap-2 sm:gap-3 opacity-0 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2 sm:gap-3">
              <span className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground sm:px-4">
                {step}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          No answers shown
        </p>
      </div>
    </section>
  );
};

export default Hero;
