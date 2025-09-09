import { useLocation, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";
import DockitoLogo from "@/components/DockitoLogo";

const Navbar = () => {
  const location = useLocation();
  const params = useParams();
  
  const getBreadcrumbItems = () => {
    const items = [
      { label: "State: New York", href: "/dockets", isLast: false }
    ];
    
    if (location.pathname === "/dockets") {
      items.push({ label: "Page: Dockets", href: "/dockets", isLast: true });
    } else if (location.pathname === "/orgs") {
      items.push({ label: "Page: Organizations", href: "/orgs", isLast: true });
    } else if (location.pathname.startsWith("/org/")) {
      const orgName = params.orgName ? decodeURIComponent(params.orgName) : "Organization";
      items.push({ label: `Organization: ${orgName}`, href: location.pathname, isLast: true });
    } else if (location.pathname.startsWith("/docket/")) {
      const docketId = params.docket_govid || "Docket";
      items.push({ label: `Docket: ${docketId}`, href: location.pathname, isLast: true });
    }
    
    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-500 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full px-4 h-14 flex items-center">
        <div className="flex items-center w-full">
          {/* Hoverable Dockito Logo */}
          <div className="group flex items-center">
            <div className="flex items-center">
              <DockitoLogo />
              <div className="overflow-hidden transition-all duration-300 ease-in-out group-hover:w-20 w-0">
                <span className="text-foreground font-semibold whitespace-nowrap ml-2">
                  dockito
                </span>
              </div>
            </div>
          </div>
          
          {/* Breadcrumb content that gets pushed */}
          <div className="flex items-center gap-2 text-sm ml-4 transition-all duration-300 ease-in-out">
            <span className="text-muted-foreground">State:</span>
            <span className="text-foreground font-medium">New York</span>
            
            {(location.pathname.startsWith("/org/") || location.pathname.startsWith("/docket/")) && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                {location.pathname.startsWith("/org/") && (
                  <>
                    <span className="text-muted-foreground">Org:</span>
                    <span className="text-foreground font-medium">
                      {params.orgName ? decodeURIComponent(params.orgName) : 
                       location.pathname.split('/org/')[1] ? decodeURIComponent(location.pathname.split('/org/')[1]) : "Organization"}
                    </span>
                  </>
                )}
                {location.pathname.startsWith("/docket/") && (
                  <>
                    <span className="text-muted-foreground">Docket:</span>
                    <span className="text-foreground font-medium">
                      {params.docket_govid ? params.docket_govid : 
                       location.pathname.split('/docket/')[1] ? location.pathname.split('/docket/')[1] : "Docket"}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;