import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "./BottomNav";
import { WelcomeDialog } from "./WelcomeDialog";
import { Archive } from "lucide-react";
import { Button } from "./ui/button";

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />
      
      {/* Branding Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dreamlink</h1>
          {location.pathname === "/" && (
            <Link to="/archive">
              <Button variant="ghost" size="sm" className="gap-2">
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">Archive</span>
              </Button>
            </Link>
          )}
        </div>
      </header>
      
      <div className="h-[calc(100vh-72px)] overflow-hidden pb-16 max-w-6xl mx-auto">
        <Outlet />
      </div>
      
      <BottomNav currentPath={location.pathname} />
    </div>
  );
};
