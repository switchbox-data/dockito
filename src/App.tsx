import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Index from "./pages/Index";
import DocketPage from "./pages/Docket";
import DocketsPage from "./pages/Dockets";
import OrganizationsPage from "./pages/Organizations";
import { CommandK } from "@/components/CommandK";
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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <CommandK />
        <Routes>
          <Route path="/" element={<Navigate to="/dockets" replace />} />
          <Route path="/dockets" element={<DocketsPage />} />
          <Route path="/orgs" element={<OrganizationsPage />} />
          <Route path="/docket/:docket_govid" element={<DocketPage />} />
          <Route path="/org/:orgName" element={<DocketsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
