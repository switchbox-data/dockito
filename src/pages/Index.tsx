const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="container text-center animate-enter">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Docket Stream</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A modern, fast, and delightful way to browse Public Utility Commission dockets. Press
          <span className="px-2 py-1 mx-2 rounded border bg-secondary">Cmd/Ctrl + K</span>
          to search by docket ID or title.
        </p>
      </section>
    </main>
  );
};

export default Index;
