import { useState, useEffect } from "react";
import { Search, TrendingUp, Zap, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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


  const featuredSections = [
    {
      title: "Rate Cases",
      description: "Utility rate adjustment proceedings and tariff filings",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Policy Dockets",
      description: "Regulatory policy development and rulemaking proceedings",
      icon: Building,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Clean Energy Siting",
      description: "Renewable energy project siting and environmental reviews",
      icon: Zap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

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

        {/* Featured Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Featured Docket Categories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <Card key={section.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full ${section.bgColor} flex items-center justify-center mb-4`}>
                      <IconComponent className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {section.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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