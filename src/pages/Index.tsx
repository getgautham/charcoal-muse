import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEntries } from "@/hooks/useEntries";
import DiaryEntry from "@/components/DiaryEntry";
import EntryList from "@/components/EntryList";
import { InsightsDashboard } from "@/components/InsightsDashboard";
import { EmotionalTimeline } from "@/components/EmotionalTimeline";
import { GrowthInsights } from "@/components/GrowthInsights";
import { KeyInsights } from "@/components/KeyInsights";
import { MobileNav } from "@/components/MobileNav";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { LogOut, Sun } from "react-feather";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { entries } = useEntries(refreshKey);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "See you next time!",
      });
    }
  };

  const handleEntryCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <WelcomeDialog />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sun className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-lg">Muze</span>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Key Insights - Top Priority */}
        <KeyInsights entries={entries} />

        {/* Write Section - Highest Value */}
        <div id="write" className="scroll-mt-20">
          <DiaryEntry onEntryCreated={handleEntryCreated} />
        </div>

        {/* Recent Entries with bulb icon */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold">Recent Entries</h2>
          </div>
          <EntryList refresh={refreshKey} />
        </div>

        {/* Asymmetrical Designer Grid */}
        <div id="story" className="scroll-mt-20">
          {/* Large feature - Timeline */}
          <div className="mb-4">
            <EmotionalTimeline entries={entries} />
          </div>

          {/* Two-column asymmetric layout */}
          <div className="grid grid-cols-3 gap-4">
            {/* Tall left card - Growth Insights (takes 2/3 width) */}
            <div className="col-span-2">
              <GrowthInsights entries={entries} />
            </div>

            {/* Compact right card - Quick Insights (takes 1/3 width) */}
            <div id="insights" className="scroll-mt-20 col-span-1">
              <InsightsDashboard entries={entries} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};

export default Index;
