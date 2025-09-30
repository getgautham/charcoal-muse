import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEntries } from "@/hooks/useEntries";
import { ChatJournal } from "@/components/ChatJournal";
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
    <div className="min-h-screen bg-background">
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

      <div className="max-w-md mx-auto h-[calc(100vh-3.5rem)]">
        {/* Chat Journal - Full Height */}
        <div id="chat" className="h-full">
          <ChatJournal onEntryCreated={handleEntryCreated} />
        </div>
      </div>

      {/* Secondary Content - Hidden by default, accessible via scroll/nav */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-4 bg-background">
        {/* Key Insights */}
        <div id="insights" className="scroll-mt-20">
          <KeyInsights entries={entries} />
        </div>

        {/* Recent Entries */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold">Recent Entries</h2>
          </div>
          <EntryList refresh={refreshKey} />
        </div>

        {/* Timeline */}
        <div id="story" className="scroll-mt-20">
          <div className="mb-4">
            <EmotionalTimeline entries={entries} />
          </div>

          {/* Asymmetric grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <GrowthInsights entries={entries} />
            </div>
            <div className="col-span-1">
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
