import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  const handleDocketsNavigation = () => {
    // Home page should always start with default sort (fresh browsing session)
    try { localStorage.removeItem('dockets-sort'); } catch {}
    navigate('/dockets?sortBy=date&sortDir=desc');
  };
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="container text-center animate-enter space-y-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Dockito</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A modern, fast, and delightful way to browse Public Utility Commission dockets. Press
            <span className="px-2 py-1 mx-2 rounded border bg-secondary">Cmd/Ctrl + K</span>
            to search by docket ID or title.
          </p>
        </div>
        <div>
          <Button onClick={handleDocketsNavigation}>Browse all NY PSC dockets</Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
