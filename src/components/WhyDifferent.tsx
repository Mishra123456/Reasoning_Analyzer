import { Check } from "lucide-react";

const points = [
  "Does not give answers",
  "Safe for numeric problems",
  "Focuses on reasoning, not results",
  "Designed for real interviews and research",
];

const WhyDifferent = () => {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-3xl font-bold">Why This Is Different</h2>
        <ul className="mt-8 space-y-4">
          {points.map((point, i) => (
            <li
              key={point}
              className="flex items-start gap-3 text-base text-foreground opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WhyDifferent;
