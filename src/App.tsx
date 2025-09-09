import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import Home from "./pages/Home";
import DocketPage from "./pages/Docket";
import DocketsPage from "./pages/Dockets";
import OrganizationsPage from "./pages/Organizations";
import AttachmentPage from "./pages/Attachment";
import Auth from "./pages/Auth";
import Favorites from "./pages/Favorites";
import { CommandKProvider } from "@/components/CommandK";
import Navbar from "@/components/Navbar";
import AppSidebar from "@/components/AppSidebar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Scroll to top component
const ScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Use setTimeout to ensure this runs after any other scroll effects
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandKProvider>
            <ScrollToTop />
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dockets" element={<DocketsPage />} />
                      <Route path="/orgs" element={<OrganizationsPage />} />
                      <Route path="/docket/:docket_govid" element={<DocketPage />} />
                      <Route path="/docket/:docket_govid/attachment/:attachment_uuid" element={<AttachmentPage />} />
                      <Route path="/org/:orgName" element={<DocketsPage />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/favorites" element={<Favorites />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </CommandKProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;