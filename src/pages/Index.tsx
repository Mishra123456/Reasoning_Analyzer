import Hero from "@/components/Hero";
import InteractiveDemo from "@/components/InteractiveDemo";
import ModesOverview from "@/components/ModesOverview";
import WhyDifferent from "@/components/WhyDifferent";
import SiteFooter from "@/components/SiteFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <span className="text-sm font-bold tracking-tight text-foreground">
            Reasoning Mistake Analyzer
          </span>
          <a
            href="https://github.com/Mishra123456/Reasoning_Analyzer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </nav>
      <Hero />
      <InteractiveDemo />
      <ModesOverview />
      <WhyDifferent />
      <SiteFooter />
    </div>
  );
};

export default Index;
