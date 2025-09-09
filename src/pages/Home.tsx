import { useState, useEffect } from "react";
import { Search, TrendingUp, Zap, Building, FileText, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { MOCK_DOCKETS, type Docket } from "@/data/mock";

const Home = () => {
  const navigate = useNavigate();

  // Function to open Command K menu
  const openCommandK = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };


  // Helper function to get curated dockets for each section
  const getCuratedDockets = (category: string): Docket[] => {
    // For now, randomly select dockets for each category
    // Later this can be replaced with hand-selected curation
    const shuffled = [...MOCK_DOCKETS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2); // Show 2 dockets per section
  };

  const curatedSections = [
    {
      title: "Recent Rate Cases",
      description: "Latest utility rate adjustment proceedings",
      icon: TrendingUp,
      dockets: getCuratedDockets("rate"),
    },
    {
      title: "Policy Development",
      description: "Active regulatory policy proceedings",
      icon: Building,
      dockets: getCuratedDockets("policy"),
    },
    {
      title: "Clean Energy Projects",
      description: "Renewable energy siting and reviews",
      icon: Zap,
      dockets: getCuratedDockets("energy"),
    },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            New York Public Service Commission
          </h1>
          <p className="text-xl text-muted-foreground">
            Search and explore regulatory dockets, filings, and proceedings
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto">
          <div 
            className="relative cursor-pointer flex h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={openCommandK}
          >
            <Search className="mr-3 h-5 w-5 shrink-0 opacity-50" />
            <span className="text-base text-muted-foreground">
              Type a docket number, title, or organization... (Cmd/Ctrl + K)
            </span>
          </div>
        </div>

        {/* Curated Docket Sections */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-center">Curated Dockets</h2>
          {curatedSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div key={section.title} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center gap-3 border-b pb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                
                {/* Dockets List */}
                <div className="grid gap-4 md:grid-cols-2">
                  {section.dockets.map((docket) => (
                    <Card key={docket.docket_govid} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <Link 
                              to={`/dockets/${docket.docket_govid}`}
                              className="hover:underline"
                            >
                              <CardTitle className="text-base leading-tight line-clamp-2">
                                {docket.docket_title}
                              </CardTitle>
                            </Link>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {docket.docket_govid}
                              </Badge>
                              {docket.industry && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {docket.industry}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {docket.petitioner && (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span className="truncate">{docket.petitioner}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>Opened {formatDate(docket.opened_date)}</span>
                            {docket.current_status && (
                              <Badge variant="outline" className="text-xs">
                                {docket.current_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dockets")}>
            Browse All Dockets
          </Button>
          <Button variant="outline" onClick={() => navigate("/orgs")}>
            View Organizations
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;