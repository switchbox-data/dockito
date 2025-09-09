import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Building, User, Star, Heart, DollarSign, Frown, Lock, Search, Flame, FileCheck, Gavel, Book, EyeOff, FileSpreadsheet, TrendingUp, Microscope, Clipboard, CheckCircle, MessageCircle, Lightbulb, HelpCircle } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getIndustryIcon } from "@/utils/industryIcons";

interface DocketType {
  uuid: string;
  docket_govid: string;
  docket_title: string;
  docket_description: string;
  docket_type: string;
  docket_subtype: string;
  opened_date: string;
  closed_date?: string;
  industry: string;
  current_status: string;
  petitioner_strings: string[] | null;
}

const FavoritesPage = () => {
  const { user } = useAuth();
  const { favorites, isFavorited, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const [dockets, setDockets] = useState<DocketType[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: '/favorites' } } });
    }
  }, [user, navigate]);

  // Fetch favorited dockets
  useEffect(() => {
    const fetchFavoritedDockets = async () => {
      if (!user || favorites.length === 0) {
        setDockets([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('dockets')
          .select('*')
          .in('docket_govid', favorites);

        if (error) {
          console.error('Error fetching favorited dockets:', error);
          return;
        }

        setDockets(data || []);
      } catch (err) {
        console.error('Error fetching favorited dockets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritedDockets();
  }, [user, favorites]);

  // Helper functions for docket type icons and colors
  const getDocketTypeIcon = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition': return Heart;
      case 'tariff': return DollarSign;
      case 'complaint': return Frown;
      case 'contract': return Lock;
      case 'audit': return Search;
      case 'incident': return Flame;
      case 'compliance': return FileCheck;
      case 'commission instituted new case proceeding': return Gavel;
      case 'rulemaking': return Book;
      case 'exception from disclosure': return EyeOff;
      case 'company workpapers': return FileSpreadsheet;
      case 'analysis': return TrendingUp;
      case 'investigation': return Microscope;
      case 'office policy and procedures': return Clipboard;
      case 'authorization': return CheckCircle;
      case 'complaint and inquiry': return MessageCircle;
      case 'policy initiative': return Lightbulb;
      default: return HelpCircle;
    }
  };

  const getDocketTypeColor = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition': return 'text-blue-600';
      case 'tariff': return 'text-green-600';
      case 'complaint': return 'text-red-600';
      case 'contract': return 'text-purple-600';
      case 'audit': return 'text-orange-600';
      case 'incident': return 'text-red-500';
      case 'compliance': return 'text-green-500';
      case 'commission instituted new case proceeding': return 'text-red-700';
      case 'rulemaking': return 'text-blue-700';
      case 'exception from disclosure': return 'text-gray-600';
      case 'company workpapers': return 'text-green-700';
      case 'analysis': return 'text-blue-500';
      case 'investigation': return 'text-purple-700';
      case 'office policy and procedures': return 'text-gray-700';
      case 'authorization': return 'text-green-600';
      case 'complaint and inquiry': return 'text-orange-700';
      case 'policy initiative': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const getDocketTypeBadgeColors = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition': return 'bg-blue-50 border-blue-200';
      case 'tariff': return 'bg-green-50 border-green-200';
      case 'complaint': return 'bg-red-50 border-red-200';
      case 'contract': return 'bg-purple-50 border-purple-200';
      case 'audit': return 'bg-orange-50 border-orange-200';
      case 'incident': return 'bg-red-50 border-red-300';
      case 'compliance': return 'bg-green-50 border-green-300';
      case 'commission instituted new case proceeding': return 'bg-red-50 border-red-300';
      case 'rulemaking': return 'bg-blue-50 border-blue-300';
      case 'exception from disclosure': return 'bg-gray-50 border-gray-300';
      case 'company workpapers': return 'bg-green-50 border-green-300';
      case 'analysis': return 'bg-blue-50 border-blue-300';
      case 'investigation': return 'bg-purple-50 border-purple-300';
      case 'office policy and procedures': return 'bg-gray-50 border-gray-300';
      case 'authorization': return 'bg-green-50 border-green-300';
      case 'complaint and inquiry': return 'bg-orange-50 border-orange-300';
      case 'policy initiative': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getDocketTypeHoverBorderColors = (type: string) => {
    const typeKey = type?.toLowerCase().trim();
    switch (typeKey) {
      case 'petition': return 'group-hover:border-blue-600';
      case 'tariff': return 'group-hover:border-green-600';
      case 'complaint': return 'group-hover:border-red-600';
      case 'contract': return 'group-hover:border-purple-600';
      case 'audit': return 'group-hover:border-orange-600';
      case 'incident': return 'group-hover:border-red-600';
      case 'compliance': return 'group-hover:border-green-600';
      case 'commission instituted new case proceeding': return 'group-hover:border-red-700';
      case 'rulemaking': return 'group-hover:border-blue-700';
      case 'exception from disclosure': return 'group-hover:border-gray-600';
      case 'company workpapers': return 'group-hover:border-green-700';
      case 'analysis': return 'group-hover:border-blue-600';
      case 'investigation': return 'group-hover:border-purple-700';
      case 'office policy and procedures': return 'group-hover:border-gray-700';
      case 'authorization': return 'group-hover:border-green-600';
      case 'complaint and inquiry': return 'group-hover:border-orange-700';
      case 'policy initiative': return 'group-hover:border-yellow-600';
      default: return 'group-hover:border-primary/30';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <Star className="h-6 w-6 text-yellow-500 fill-current" />
          My Favorites
        </h1>
        <p className="text-muted-foreground">Your saved dockets</p>
      </header>

      <section aria-label="Results" className="space-y-4">
        {dockets.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-4">
              Start exploring dockets and add them to your favorites!
            </p>
            <Button onClick={() => navigate('/dockets')}>
              Browse Dockets
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {dockets.map((d) => (
              <NavLink
                key={d.uuid}
                to={`/docket/${d.docket_govid}`}
                aria-label={`Open docket ${d.docket_govid}`}
                className="group block focus-visible:outline-none"
              >
                <Card className="transition-colors hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background group bg-white/95">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-start justify-between gap-3 mb-1 pb-2">
                      <div className="flex flex-wrap gap-1">
                        {d.docket_type && (
                          <Badge variant="outline" className={`inline-flex items-center gap-1.5 transition-colors ${getDocketTypeBadgeColors(d.docket_type)} ${getDocketTypeHoverBorderColors(d.docket_type)}`}>
                            {(() => {
                              const TypeIcon = getDocketTypeIcon(d.docket_type);
                              const typeColor = getDocketTypeColor(d.docket_type);
                              return <TypeIcon size={12} className={typeColor} />;
                            })()}
                            {d.docket_type}
                          </Badge>
                        )}
                        {d.docket_subtype && d.docket_type !== "Commission Instituted New Case Proceeding" && <Badge variant="outline" className="border-gray-300 bg-background group-hover:border-primary/30 transition-colors">{d.docket_subtype}</Badge>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {d.industry && (
                          <Badge variant="outline" className="inline-flex items-center gap-1.5 border-gray-300 bg-background group-hover:border-primary/30 transition-colors">
                            {(() => {
                              const IndustryIcon = getIndustryIcon(d.industry);
                              return <IndustryIcon size={12} className="text-muted-foreground" />;
                            })()}
                            {d.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-border/50 pt-3">
                      <div className="space-y-2 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-foreground font-semibold">{d.docket_govid}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(d.docket_govid);
                              }}
                              className="h-8 w-8 p-0 hover:bg-yellow-50"
                            >
                              <Star
                                size={16}
                                className={cn(
                                  "transition-colors",
                                  isFavorited(d.docket_govid)
                                    ? "text-yellow-500 fill-current"
                                    : "text-muted-foreground hover:text-yellow-500"
                                )}
                              />
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">Opened: {formatDate(d.opened_date)}</span>
                        </div>
                        <h3 className="text-sm font-normal leading-snug text-foreground">{d.docket_title ?? "Untitled docket"}</h3>
                      </div>
                      
                      <div className="border-t border-border/50 pt-3">
                        <div className="flex flex-wrap gap-2">
                          {d.petitioner_strings?.slice(0, 2).map(p => (
                            <Badge
                              key={p}
                              variant="outline"
                              className="text-xs cursor-pointer bg-background border-gray-300 hover:border-gray-400 transition-colors"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/org/${encodeURIComponent(p)}`); }}
                            >
                              {p}
                            </Badge>
                          ))}
                          {d.petitioner_strings && d.petitioner_strings.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{d.petitioner_strings.length - 2} more</Badge>
                          )}
                          {d.current_status && <Badge variant="secondary">{d.current_status}</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </NavLink>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default FavoritesPage;