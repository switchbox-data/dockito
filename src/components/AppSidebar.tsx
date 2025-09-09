import { useState } from "react";
import { Home, FolderOpen, Building, Search, Star } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCommandK } from "@/components/CommandK";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";

const AppSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const { open: openCommandK } = useCommandK();
  const { user } = useAuth();
  const { favorites } = useFavorites();

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
        "fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-r border-t border-gray-500 transition-all duration-300 ease-in-out z-40",
        isExpanded ? "w-48" : "w-14"
      )}
    >
      <div
        className="h-full"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
      <nav className="p-2 space-y-2">
        {navigationItems.map((item, index) => {
          const IconComponent = item.icon;
          const active = item.path ? isActive(item.path) : false;
          
          if (item.isButton) {
            return (
              <button
                key={index}
                onClick={item.action}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 w-full text-left",
                  "hover:bg-muted/90 focus-visible:outline-none"
                )}
              >
                <IconComponent className="h-5 w-5 flex-shrink-0" />
                <span 
                  className={cn(
                    "transition-opacity duration-300 whitespace-nowrap",
                    isExpanded ? "opacity-100" : "opacity-0"
                  )}
                >
                  {item.label}
                </span>
              </button>
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
                  "transition-opacity duration-300 whitespace-nowrap",
                  isExpanded ? "opacity-100" : "opacity-0"
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
                  "transition-opacity duration-300 whitespace-nowrap",
                  isExpanded ? "opacity-100" : "opacity-0"
                )}
              >
                Favorites ({favorites.length})
              </span>
            </Link>
          </>
        )}
      </nav>
      </div>
    </div>
  );
};

export default AppSidebar;