import { useState } from "react";
import { Search, TrendingUp, Zap, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dockets?search=${encodeURIComponent(searchQuery.trim())}`);
    }
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
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search dockets, organizations, or proceedings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-base"
              />
            </div>
            <Button 
              type="submit" 
              variant="outline"
              size="default"
              disabled={!searchQuery.trim()}
              className="px-4 py-2 whitespace-nowrap"
            >
              Search
            </Button>
          </div>
        </form>

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