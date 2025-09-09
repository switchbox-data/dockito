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
    // Create more mock data by duplicating and varying the existing dockets
    const baseDockets = [...MOCK_DOCKETS];
    const expandedDockets: Docket[] = [];
    
    // Generate variations of existing dockets to simulate more content
    for (let i = 0; i < 4; i++) {
      baseDockets.forEach((docket, index) => {
        const variation = {
          ...docket,
          docket_govid: `${docket.docket_govid.slice(0, -2)}${String(index + i * 10).padStart(2, '0')}`,
          docket_title: `${docket.docket_title} ${i > 0 ? `- Phase ${i + 1}` : ''}`,
          opened_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().slice(0, 10),
        };
        expandedDockets.push(variation);
      });
    }
    
    return expandedDockets.slice(0, 4); // Show 4 dockets per section
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
        <div className="max-w-4xl mx-auto mb-12">
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
                
                {/* Dockets Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {section.dockets.map((docket) => (
                    <Card key={docket.docket_govid} className="hover:shadow-md hover:scale-105 transition-all duration-200 hover-scale bg-white/95">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Docket ID Badge */}
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs font-mono">
                              {docket.docket_govid}
                            </Badge>
                            {docket.current_status && (
                              <Badge variant="outline" className="text-xs">
                                {docket.current_status}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Title */}
                          <Link 
                            to={`/dockets/${docket.docket_govid}`}
                            className="story-link block"
                          >
                            <h4 className="text-sm font-medium leading-tight line-clamp-3 hover:text-primary transition-colors">
                              {docket.docket_title}
                            </h4>
                          </Link>
                          
                          {/* Metadata */}
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {docket.industry && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span className="capitalize">{docket.industry}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(docket.opened_date)}</span>
                            </div>
                            {docket.petitioner && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="truncate" title={docket.petitioner}>
                                  {docket.petitioner}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Show more link */}
                <div className="text-center pt-2">
                  <Link 
                    to="/dockets" 
                    className="text-sm text-primary hover:underline story-link"
                  >
                    View all {section.title.toLowerCase()} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;