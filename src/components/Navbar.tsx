import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const location = useLocation();
  const params = useParams();
  const [attachmentTitle, setAttachmentTitle] = useState<string>("");
  
  // Fetch attachment title when on attachment route
  useEffect(() => {
    const fetchAttachmentTitle = async () => {
      if (location.pathname.includes("/attachment/")) {
        const attachmentUuid = location.pathname.split('/attachment/')[1];
        if (attachmentUuid) {
          try {
            const { data, error } = await supabase
              .from('attachments')
              .select('attachment_title')
              .eq('uuid', attachmentUuid)
              .single();
            
            if (!error && data) {
              setAttachmentTitle(data.attachment_title || 'Document');
            } else {
              setAttachmentTitle('Document');
            }
          } catch (err) {
            setAttachmentTitle('Document');
          }
        }
      } else {
        setAttachmentTitle('');
      }
    };
    
    fetchAttachmentTitle();
  }, [location.pathname]);

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
    } else if (location.pathname.includes("/attachment/")) {
      // Handle attachment route: /docket/{docket_govid}/attachment/{attachment_uuid}
      const docketId = location.pathname.split('/docket/')[1]?.split('/')[0] || "Docket";
      items.push({ label: `Docket: ${docketId}`, href: `/docket/${docketId}`, isLast: false });
      items.push({ label: `Doc: Loading...`, href: location.pathname, isLast: true });
    } else if (location.pathname.startsWith("/docket/")) {
      const docketId = params.docket_govid || location.pathname.split('/docket/')[1] || "Docket";
      items.push({ label: `Docket: ${docketId}`, href: location.pathname, isLast: true });
    }
    
    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-500 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full h-14 flex items-center">
        <div className="flex items-center w-full pl-4">
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
          
          {/* Breadcrumb arrow separator */}
          <ChevronRight className="h-4 w-4 text-muted-foreground mx-4" />
          
          {/* Breadcrumb content that aligns with main content */}
          <div className="flex items-center gap-2 text-sm transition-all duration-300 ease-in-out min-w-0 flex-1 whitespace-nowrap overflow-hidden">
            <span className="text-muted-foreground whitespace-nowrap">State:</span>
            <span className="text-foreground font-medium whitespace-nowrap">New York</span>
            
            {(location.pathname.startsWith("/org/") || location.pathname.startsWith("/docket/")) && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-4 flex-shrink-0" />
                {location.pathname.startsWith("/org/") && (
                  <>
                    <span className="text-muted-foreground whitespace-nowrap">Org:</span>
                    <span className="text-foreground font-medium truncate whitespace-nowrap">
                      {params.orgName ? decodeURIComponent(params.orgName) : 
                       location.pathname.split('/org/')[1] ? decodeURIComponent(location.pathname.split('/org/')[1]) : "Organization"}
                    </span>
                  </>
                )}
                {location.pathname.includes("/attachment/") && (
                  <>
                    <span className="text-muted-foreground whitespace-nowrap">Docket:</span>
                    <span className="text-foreground font-medium whitespace-nowrap">
                      {location.pathname.split('/docket/')[1]?.split('/')[0] || "Unknown"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-4 flex-shrink-0" />
                    <span className="text-muted-foreground whitespace-nowrap">Doc:</span>
                    <span className="text-foreground font-medium whitespace-nowrap max-w-[400px] truncate inline-block">{attachmentTitle || 'Document'}</span>
                  </>
                )}
                {location.pathname.startsWith("/docket/") && !location.pathname.includes("/attachment/") && (
                  <>
                    <span className="text-muted-foreground whitespace-nowrap">Docket:</span>
                    <span className="text-foreground font-medium whitespace-nowrap">
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