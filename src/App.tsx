import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Mirror } from "./pages/Mirror";
import { Lens } from "./pages/Lens";
import { Compass } from "./pages/Compass";
import { Archive } from "./pages/Archive";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { MainLayout } from "./components/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Mirror />} />
            <Route path="/mirror" element={<Mirror />} />
            <Route path="/lens" element={<Lens />} />
            <Route path="/compass" element={<Compass />} />
            <Route path="/archive" element={<Archive />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
