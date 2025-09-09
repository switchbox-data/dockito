import { useState, useEffect } from "react";
import { Home, FolderOpen, Building, Search, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCommandK } from "@/components/CommandK";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const AppSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topFavoriteDockets, setTopFavoriteDockets] = useState<Array<{govid: string, title: string}>>([]);
  const location = useLocation();
  const { open: openCommandK } = useCommandK();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const isMobile = useIsMobile();

  // Fetch top 5 favorite dockets
  useEffect(() => {
    const fetchTopFavorites = async () => {
      if (!user || favorites.length === 0) {
        setTopFavoriteDockets([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('dockets')
          .select('docket_govid, docket_title')
          .in('docket_govid', favorites.slice(0, 5));

        if (error) {
          console.error('Error fetching favorite dockets:', error);
          return;
        }

        const formattedDockets = (data || []).map(d => ({
          govid: d.docket_govid,
          title: d.docket_title || `Docket ${d.docket_govid}`
        }));

        setTopFavoriteDockets(formattedDockets);
      } catch (err) {
        console.error('Error fetching favorite dockets:', err);
      }
    };

    fetchTopFavorites();
  }, [user, favorites]);

  // Listen for real-time changes to favorites
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('favorites-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Favorites changed:', payload);
          // The favorites will be refetched by the useFavorites hook
          // which will trigger the useEffect above to update topFavoriteDockets
          // Use setTimeout to avoid React queue issues
          setTimeout(() => {
            // Force a re-render by updating a dummy state if needed
          }, 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navigationItems = [
    {
      icon: Search,
      label: "Search",
      action: () => openCommandK(),
      isButton: true,
    },
    {
      icon: Home,
      label: "Home",
      path: "/",
    },
    {
      icon: FolderOpen,
      label: "Dockets",
      path: "/dockets",
    },
    {
      icon: Building,
      label: "Organizations",
      path: "/orgs",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={cn(
        isMobile 
          ? "h-full bg-white border-r border-gray-500" 
          : "fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-r border-t border-gray-500 transition-all duration-150 ease-in-out z-40",
        !isMobile && (isExpanded ? "w-48" : "w-14")
      )}
    >
      <div
        className="h-full"
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
      <nav className="p-2 space-y-2">
        {navigationItems.map((item, index) => {
          const IconComponent = item.icon;
          const active = item.path ? isActive(item.path) : false;
          
          if (item.isButton) {
            return (
              <div key={index}>
                <button
                  onClick={item.action}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 w-full text-left",
                    "hover:bg-muted/90 focus-visible:outline-none"
                  )}
                >
                  <IconComponent className="h-5 w-5 flex-shrink-0" />
                  <span 
                    className={cn(
                      "transition-opacity duration-150 whitespace-nowrap",
                      (isMobile || isExpanded) ? "opacity-100" : "opacity-0"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
                {/* Separator after search */}
                <div className="h-px bg-border my-2" />
              </div>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path!}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                "hover:bg-muted/90 focus-visible:outline-none",
                active && "bg-muted/90 text-primary font-medium"
              )}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              <span 
                className={cn(
                  "transition-opacity duration-150 whitespace-nowrap",
                  (isMobile || isExpanded) ? "opacity-100" : "opacity-0"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* Favorites section */}
        {user && (
          <>
            <div className="h-px bg-border my-4" />
            <Link
              to="/favorites"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                "hover:bg-muted/90 focus-visible:outline-none",
                isActive("/favorites") && "bg-muted/90 text-primary font-medium"
              )}
            >
              <Star className="h-5 w-5 flex-shrink-0 text-yellow-500" />
              <span 
                className={cn(
                  "transition-opacity duration-150 whitespace-nowrap",
                  (isMobile || isExpanded) ? "opacity-100" : "opacity-0"
                )}
              >
                Favorites ({favorites.length})
              </span>
            </Link>
            
            {/* Top 5 favorite dockets */}
            {(isMobile || isExpanded) && topFavoriteDockets.length > 0 && (
              <div className="ml-6 space-y-1 mt-2">
                {topFavoriteDockets.map((docket) => (
                  <Link
                    key={docket.govid}
                    to={`/docket/${docket.govid}`}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 text-sm",
                      "hover:bg-muted/90 focus-visible:outline-none",
                      isActive(`/docket/${docket.govid}`) && "bg-muted/90 text-primary font-medium"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                    <span className="truncate">
                      {docket.govid}
                    </span>
                  </Link>
                ))}
                {favorites.length > 5 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    +{favorites.length - 5} more
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </nav>
      </div>
    </div>
  );
};

export default AppSidebar;