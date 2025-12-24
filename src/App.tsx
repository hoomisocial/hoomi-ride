import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Transport from "./pages/Transport";
import Delivery from "./pages/Delivery";
import DeliveryDetails from "./pages/DeliveryDetails";
import LocationPicker from "./pages/LocationPicker";
import Tracking from "./pages/Tracking";
import HoomiAgent from "./pages/HoomiAgent";
import History from "./pages/History";
import Chat from "./pages/Chat";
import Activity from "./pages/Activity";
import AppPermissions from "./pages/AppPermissions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/permissions" element={<AppPermissions />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/delivery/details" element={<DeliveryDetails />} />
          <Route path="/location/:id" element={<LocationPicker />} />
          <Route path="/tracking/:id" element={<Tracking />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/hoomi-agent" element={<HoomiAgent />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
