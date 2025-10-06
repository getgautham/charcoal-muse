import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useEntries } from "@/hooks/useEntries";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserGoals } from "@/hooks/useUserGoals";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryInput } from "./MemoryInput";
import { MemoryFeedback } from "./MemoryFeedback";
import { MirrorInsight } from "./MirrorInsight";

interface MirrorMessage {
  id: string;
  type: 'memory' | 'insight';
  content: string;
  mood?: string;
  timestamp: string;
}

interface ChatJournalProps {
  onEntryCreated: () => void;
}

export const ChatJournal = ({ onEntryCreated }: ChatJournalProps) => {
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastMemory, setLastMemory] = useState<{ count: number; mood?: string } | null>(null);
  const [lastLoginDays, setLastLoginDays] = useState(0);
  const { toast } = useToast();
  const preferences = useUserPreferences();
  const { entries } = useEntries();
  const { subscribed, prompts_remaining, openCheckout, refresh } = useSubscription();
  const { goals } = useUserGoals();

  useEffect(() => {
    loadMessages();
    loadDailyPrompt();
    calculateLastLogin();
  }, []);

  useEffect(() => {
    const handleDiceRoll = () => {
      loadDailyPrompt();
    };
    window.addEventListener('diceRoll', handleDiceRoll);
    return () => window.removeEventListener('diceRoll', handleDiceRoll);
  }, []);

  const calculateLastLogin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('diary_entries')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const lastEntry = new Date(data.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastEntry.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setLastLoginDays(diffDays);
      }
    } catch (error) {
      console.error('Error calculating last login:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true })
        .limit(20);

      if (error) throw error;
      if (data) {
        setMessages(data.map(msg => ({
          id: msg.id,
          type: msg.type === 'user' ? 'memory' : 'insight',
          content: msg.content,
          mood: msg.mood || undefined,
          timestamp: msg.timestamp
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadDailyPrompt = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-diary-assistant', {
        body: { action: 'prompt', preferences }
      });
      if (error) throw error;
      setPromptText(data.result);
    } catch (error) {
      console.error('Error loading prompt:', error);
    }
  };

  const getTimePhrasing = () => {
    if (lastLoginDays <= 1) return "yesterday";
    if (lastLoginDays <= 7) return "this week";
    if (lastLoginDays <= 30) return "the past few weeks";
    return "since you were last here";
  };

  const handleMemorySubmit = async (content: string) => {
    if (loading) return;

    if (!subscribed && prompts_remaining !== undefined && prompts_remaining <= 0) {
      toast({
        title: "Memory limit reached",
        description: "Upgrade to Premium for unlimited memories!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const recentEntries = entries.slice(0, 5).map(e => ({
        mood: e.mood,
        created_at: e.created_at
      }));

      const userGoals = goals.map(g => ({
        goal_text: g.goal_text,
        category: g.category
      }));

      // Get AI mood detection and lens analysis
      const [moodResponse, lensResponse] = await Promise.all([
        supabase.functions.invoke('ai-diary-assistant', {
          body: { action: 'mood', content }
        }),
        supabase.functions.invoke('ai-diary-assistant', {
          body: { action: 'mirror', content }
        })
      ]);

      if (moodResponse.error) throw moodResponse.error;
      if (lensResponse.error) throw lensResponse.error;

      const detectedMood = moodResponse.data.result.trim().toLowerCase();
      let lensInsights = {};
      try {
        lensInsights = lensResponse.data?.result ? JSON.parse(lensResponse.data.result) : {};
      } catch (e) {
        console.error('Failed to parse lens insights:', e);
      }

      const totalMemories = entries.length + 1;
      setLastMemory({ count: totalMemories, mood: detectedMood });
      setShowFeedback(true);

      setTimeout(() => {
        const insightMessage: MirrorMessage = {
          id: Date.now().toString(),
          type: 'insight',
          content: JSON.stringify(lensInsights),
          mood: detectedMood,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, insightMessage]);
      }, 2000);

      await supabase.from('diary_entries').insert({
        user_id: user.id,
        title: null,
        content,
        mood: detectedMood,
        lens_insights: lensInsights,
      });

      if (!subscribed) {
        await supabase.rpc('increment_prompt_usage', { p_user_id: user.id });
        if (refresh) refresh();
      }

      onEntryCreated();
      loadDailyPrompt();
      calculateLastLogin();

    } catch (error: any) {
      setShowFeedback(false);
      toast({
        title: "Error",
        description: error.message || "Failed to capture memory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MemoryFeedback 
        memoryCount={lastMemory?.count || 0}
        mood={lastMemory?.mood}
        show={showFeedback}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === 'insight' ? (
              <MirrorInsight 
                lensInsights={JSON.parse(message.content || '{}')}
                timestamp={message.timestamp}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="bg-background px-4 py-3 pb-20">
        {!subscribed && prompts_remaining !== undefined && prompts_remaining <= 5 && (
          <div className="mb-3 card-brutal bg-destructive/10 p-3 flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">
              {prompts_remaining > 0 
                ? `${prompts_remaining} memories remaining`
                : 'Memory limit reached'}
            </p>
            <Button
              size="sm"
              onClick={() => openCheckout?.()}
              className="btn-brutal bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
            >
              <Crown className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </div>
        )}

        <MemoryInput 
          onSubmit={handleMemorySubmit}
          loading={loading}
          promptText={promptText}
          timeSinceLastLogin={getTimePhrasing()}
        />
      </div>
    </div>
  );
};
