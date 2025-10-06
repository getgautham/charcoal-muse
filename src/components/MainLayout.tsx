import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "./BottomNav";
import { WelcomeDialog } from "./WelcomeDialog";

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
      
      <div className="h-screen overflow-hidden pb-16 max-w-6xl mx-auto">
        <Outlet />
      </div>
      
      <BottomNav currentPath={location.pathname} />
    </div>
  );
};
