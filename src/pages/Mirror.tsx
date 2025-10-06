import { useState } from "react";
import { MemoryInput } from "@/components/MemoryInput";
import { MemoryFeedback } from "@/components/MemoryFeedback";
import { MirrorInsight } from "@/components/MirrorInsight";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useEntries } from "@/hooks/useEntries";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LensScores } from "@/types/lens";

interface InsightDisplay {
  lens: string;
  signal: string;
  color: string;
}

export const Mirror = () => {
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastMemory, setLastMemory] = useState<{ count: number } | null>(null);
  const [currentInsight, setCurrentInsight] = useState<InsightDisplay | null>(null);
  const { toast } = useToast();
  const { subscribed, prompts_remaining, openCheckout, refresh: refreshSub } = useSubscription();
  const { entries, refresh: refreshEntries } = useEntries();

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
    setCurrentInsight(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call AI for analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('ai-diary-assistant', {
        body: { action: 'analyze', content }
      });

      if (analysisError) throw analysisError;

      const { lens_scores, dominant_lens, sentiment, mood, insights } = analysisData.result;

      // Save memory - RLS will set user_id automatically
      const { error: memoryError } = await supabase.from('memories').insert({
        content,
        lens_scores: lens_scores,
        dominant_lens,
        sentiment,
        mood
      });

      if (memoryError) throw memoryError;

      const { data: memoryData } = await supabase
        .from('memories')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (memoryData && insights && insights.length > 0) {
        await supabase.from('insights').insert(
          insights.map((insight: any) => ({
            user_id: user.id,
            memory_id: memoryData.id,
            lens: insight.lens,
            signal: insight.signal,
            interpretation: insight.interpretation
          }))
        );
      }

      const totalMemories = entries.length + 1;
      setLastMemory({ count: totalMemories });
      setShowFeedback(true);

      // Show primary insight after delay
      if (insights && insights.length > 0) {
        const primaryInsight = insights.find((i: any) => i.lens === dominant_lens) || insights[0];
        setTimeout(() => {
          setCurrentInsight({
            lens: primaryInsight.lens,
            signal: primaryInsight.interpretation,
            color: getColorForLens(primaryInsight.lens)
          });
        }, 2000);
      }

      if (!subscribed) {
        await supabase.rpc('increment_prompt_usage', { p_user_id: user.id });
        if (refreshSub) refreshSub();
      }

      await refreshEntries();

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

  const getColorForLens = (lens: string): string => {
    const colors: Record<string, string> = {
      love: '#F17A7E',
      energy: '#F6B74C',
      work: '#F47C32',
      growth: '#7057D8',
      satisfaction: '#6EB5D3'
    };
    return colors[lens] || '#6EB5D3';
  };

  return (
    <div className="flex flex-col h-full">
      <MemoryFeedback 
        memoryCount={lastMemory?.count || 0}
        show={showFeedback}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-4">
        {currentInsight && (
          <MirrorInsight 
            lensInsights={{ [currentInsight.lens]: { detected: true, signal: currentInsight.signal } }}
            timestamp={new Date().toISOString()}
          />
        )}
      </div>

      <div className="bg-background px-4 py-3 pb-24">
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
          promptText="What's one memory from this week?"
          timeSinceLastLogin="this week"
        />
      </div>
    </div>
  );
};
