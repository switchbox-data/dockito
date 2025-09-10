import { useState, useEffect, useRef } from "react";
import { Home, FolderOpen, Building, Search, Star, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCommandK } from "@/components/CommandK";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useSidebarNotification } from "@/contexts/SidebarNotificationContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import confetti from "canvas-confetti";

const AppSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);
  const favoritesRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [topFavoriteDockets, setTopFavoriteDockets] = useState<Array<{govid: string, title: string}>>([]);
  const location = useLocation();
  const { open: openCommandK } = useCommandK();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const { animatingFavorite } = useSidebarNotification();
  const isMobile = useIsMobile();

  // Handle favorite notifications - temporarily expand sidebar and show confetti
  useEffect(() => {
    if (animatingFavorite && !isMobile) {
      console.log('🎉 Starting animation for:', animatingFavorite);
      setIsNotificationExpanded(true);
      
      // Trigger confetti after a brief delay to let the sidebar expand
      const confettiTimer = setTimeout(() => {
        console.log('🎊 Triggering confetti');
        const favoriteElement = favoritesRefs.current[animatingFavorite];
        if (favoriteElement) {
          const rect = favoriteElement.getBoundingClientRect();
          const x = (rect.left + rect.width / 2) / window.innerWidth;
          const y = (rect.top + rect.height / 2) / window.innerHeight;
          
          confetti({
            particleCount: 20,
            spread: 45,
            origin: { x, y },
            colors: ['#fbbf24', '#f59e0b', '#d97706'], // Yellow/amber colors to match the star
            scalar: 0.6,
            gravity: 0.8,
            drift: 0,
            ticks: 100
          });
        }
      }, 300);
      
      // Close notification expansion after animation completes
      const timer = setTimeout(() => {
        console.log('🔄 Attempting to close sidebar');
        setIsNotificationExpanded(false);
        console.log('📋 Set isNotificationExpanded to false');
        setTimeout(() => {
          console.log('🔒 Forcing isExpanded to false');
          setIsExpanded(false);
        }, 100);
      }, 2000);
      
      return () => {
        console.log('🧹 Cleaning up timers for:', animatingFavorite);
        clearTimeout(confettiTimer);
        clearTimeout(timer);
      };
    }
  }, [animatingFavorite, isMobile]);

  // Handle closing sidebar when animation ends
  useEffect(() => {
    if (!animatingFavorite && isNotificationExpanded) {
      console.log('🏁 Animation ended, closing sidebar');
      setIsNotificationExpanded(false);
      setTimeout(() => {
        setIsExpanded(false);
      }, 100);
    }
  }, [animatingFavorite, isNotificationExpanded]);

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

  const shouldShowExpanded = isMobile || isExpanded || isNotificationExpanded;

  return (
    <div
      className={cn(
        isMobile 
          ? "h-full bg-white border-r border-gray-500" 
          : "fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-r border-t border-gray-500 transition-all duration-150 ease-in-out z-40",
        !isMobile && (shouldShowExpanded ? "w-48" : "w-14")
      )}
    >
      <div
        className="h-full"
        onMouseEnter={() => !isMobile && !isNotificationExpanded && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && !isNotificationExpanded && setIsExpanded(false)}
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
                      shouldShowExpanded ? "opacity-100" : "opacity-0"
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
                  shouldShowExpanded ? "opacity-100" : "opacity-0"
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
                  shouldShowExpanded ? "opacity-100" : "opacity-0"
                )}
              >
                Favorites ({favorites.length})
              </span>
            </Link>
            
            {/* Top 5 favorite dockets */}
            {shouldShowExpanded && topFavoriteDockets.length > 0 && (
              <div className="ml-6 space-y-1 mt-2">
                {topFavoriteDockets.map((docket) => (
                  <div
                    ref={(el) => {
                      if (el) favoritesRefs.current[docket.govid] = el;
                    }}
                    key={docket.govid}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 text-sm group/favorite relative",
                      "hover:bg-muted/90 focus-visible:outline-none",
                      isActive(`/docket/${docket.govid}`) && "bg-muted/90 text-primary font-medium",
                      animatingFavorite === docket.govid && "bg-yellow-50 border border-yellow-200"
                    )}
                  >
                    <Link
                      to={`/docket/${docket.govid}`}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 transition-all duration-300",
                        animatingFavorite === docket.govid && "bg-yellow-500"
                      )} />
                      <span className="truncate">
                        {docket.govid}
                      </span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(docket.govid);
                      }}
                      className="opacity-0 group-hover/favorite:opacity-100 transition-opacity duration-200 p-1 hover:bg-muted rounded"
                      aria-label={`Remove ${docket.govid} from favorites`}
                    >
                      <X size={12} />
                    </button>
                  </div>
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