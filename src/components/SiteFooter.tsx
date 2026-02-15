const SiteFooter = () => {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Reasoning Mistake Analyzer — AI-powered reasoning analysis without answers.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com/Mishra123456/Reasoning_Analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200 hover:text-foreground"
            >
              GitHub
            </a>
            <span>Built by Author</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
