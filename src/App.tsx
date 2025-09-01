import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import DocketPage from "./pages/Docket";
import DocketsPage from "./pages/Dockets";
import OrganizationsPage from "./pages/Organizations";
import { CommandK } from "@/components/CommandK";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CommandK />
        <Routes>
          <Route path="/" element={<Navigate to="/dockets" replace />} />
          <Route path="/dockets" element={<DocketsPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
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
