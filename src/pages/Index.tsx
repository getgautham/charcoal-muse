import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEntries } from "@/hooks/useEntries";
import { ChatJournal } from "@/components/ChatJournal";
import { LifePulse } from "@/components/LifePulse";
import { GoalsManager } from "@/components/GoalsManager";
import { TopNav } from "@/components/TopNav";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { LogOut, Sun } from "react-feather";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'story' | 'goals'>('chat');
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

  const handleDiceClick = () => {
    window.dispatchEvent(new Event('diceRoll'));
  };

  const handlePresetsClick = () => {
    // Handled by TopNav component
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />

      {/* Main Content Area */}
      <div className="h-screen overflow-hidden pb-16 max-w-6xl mx-auto">
        <div className="h-full">
          {activeTab === 'chat' ? (
            <div className="h-full">
              <ChatJournal onEntryCreated={handleEntryCreated} />
            </div>
          ) : activeTab === 'goals' ? (
            <div className="h-full overflow-y-auto px-4 py-4">
              <GoalsManager />
            </div>
          ) : (
            <div className="h-full overflow-y-auto px-4 py-4">
              <LifePulse entries={entries} />
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Navigation with Tabs */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDiceClick={handleDiceClick}
        onPresetsClick={handlePresetsClick}
      />
    </div>
  );
};

export default Index;
