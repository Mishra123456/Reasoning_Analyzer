import { BookOpen, Users, FlaskConical } from "lucide-react";

const modes = [
  {
    icon: BookOpen,
    title: "Education Mode",
    focus: "Learning & reflection",
    description: "Explains reasoning mistakes to help students understand where their thinking diverged, without revealing correct solutions.",
  },
  {
    icon: Users,
    title: "Interview Mode",
    focus: "Evaluation",
    description: "Highlights reasoning risks and structural weaknesses in problem-solving approaches, useful for assessment contexts.",
  },
  {
    icon: FlaskConical,
    title: "Research Mode",
    focus: "Cognitive analysis",
    description: "Identifies bias patterns, logical fallacies, and systematic reasoning errors for academic and analytical purposes.",
  },
];

const ModesOverview = () => {
  return (
    <section id="modes" className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-3xl font-bold">Modes</h2>
        <p className="mt-2 text-muted-foreground">
          Three specialized analysis configurations.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {modes.map((m, i) => (
            <div
              key={m.title}
              className="hover-lift rounded-xl border border-border bg-card p-6 opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <m.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <h3 className="mt-4 text-base font-bold text-primary">{m.title}</h3>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {m.focus}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModesOverview;
