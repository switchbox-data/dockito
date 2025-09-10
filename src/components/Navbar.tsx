import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronRight, User, LogOut, Menu } from "lucide-react";
import DockitoLogo from "@/components/DockitoLogo";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import AppSidebar from "./AppSidebar";

const Navbar = () => {
  const location = useLocation();
  const params = useParams();
  const { user, signOut } = useAuth();
  const [attachmentTitle, setAttachmentTitle] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
    }
  };
  
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
        <div className={`flex items-center w-full ${isMobile ? 'pl-4' : 'pl-4'}`}>
          {/* Mobile menu trigger */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/75">
                <AppSidebar />
              </SheetContent>
            </Sheet>
          )}
          
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
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 group-hover:ml-1 mr-2 transition-all duration-300 ease-in-out" />
          
          {/* Breadcrumb content that aligns with main content */}
          <div className="flex items-center gap-2 text-sm transition-all duration-300 ease-in-out min-w-0 flex-1 whitespace-nowrap overflow-hidden">
            <span className="text-muted-foreground whitespace-nowrap">State:</span>
            <span className="text-foreground font-medium whitespace-nowrap">New York</span>
            
            {(location.pathname.startsWith("/org/") || location.pathname.startsWith("/docket/") || location.pathname === "/favorites") && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {location.pathname.startsWith("/org/") && (
                  <>
                    <span className="text-muted-foreground whitespace-nowrap">Org:</span>
                    <span className="text-foreground font-medium truncate whitespace-nowrap">
                      {params.orgName ? decodeURIComponent(params.orgName) : 
                       location.pathname.split('/org/')[1] ? decodeURIComponent(location.pathname.split('/org/')[1]) : "Organization"}
                    </span>
                  </>
                )}
                {location.pathname === "/favorites" && (
                  <>
                    <span className="text-muted-foreground whitespace-nowrap">Page:</span>
                    <span className="text-foreground font-medium whitespace-nowrap">Favorites</span>
                  </>
                )}
                {location.pathname.includes("/attachment/") && (
                  <>
                    <span className="text-muted-foreground whitespace-nowrap">Docket:</span>
                    <span className="text-foreground font-medium whitespace-nowrap">
                      {location.pathname.split('/docket/')[1]?.split('/')[0] || "Unknown"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          
          {/* Auth Controls */}
          <div className="flex items-center gap-2 pr-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />
    </nav>
  );
};

export default Navbar;