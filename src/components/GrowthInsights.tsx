import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Target, Sun } from "react-feather";
import { Entry } from "@/hooks/useEntries";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface GrowthInsightsProps {
  entries: Entry[];
}

export const GrowthInsights = ({ entries }: GrowthInsightsProps) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const preferences = useUserPreferences();

  const generateGrowthInsights = async () => {
    if (entries.length < 5) return;

    setLoading(true);
    try {
      const recentEntries = entries.slice(0, 10).map(e => ({
        mood: e.mood,
        created_at: e.created_at,
        hasInsight: !!e.ai_insights
      }));

      const { data, error } = await supabase.functions.invoke('ai-diary-assistant', {
        body: {
          action: 'growth',
          preferences,
          recentEntries
        }
      });

      if (error) throw error;
      
      // Split insights by newlines or periods for better presentation
      const insightText = data.result;
      const parsedInsights = insightText
        .split(/\n|(?<=\.)\s+/)
        .filter((s: string) => s.trim().length > 20)
        .slice(0, 4);
      
      setInsights(parsedInsights);
    } catch (error) {
      console.error('Error generating growth insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entries.length >= 5 && insights.length === 0) {
      generateGrowthInsights();
    }
  }, [entries.length]);

  if (entries.length < 5) {
    return (
      <Card className="p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Growth Engine</h3>
        <p className="text-muted-foreground">
          Write {5 - entries.length} more {entries.length === 4 ? 'entry' : 'entries'} to unlock AI-powered growth insights
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Growth Engine</h2>
        </div>
        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
          <Sun className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Personalized insights based on your emotional patterns
      </p>

      {insights.length > 0 ? (
        <div className="space-y-3 mb-6">
          {insights.map((insight, i) => (
            <div 
              key={i} 
              className="p-4 rounded-lg bg-background/50 border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <p className="text-sm leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your journey...</p>
          </div>
        </div>
      )}

      <Button
        onClick={generateGrowthInsights}
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary to-primary/80"
        variant="default"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 animate-pulse" />
            Generating insights...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Refresh Growth Insights
          </span>
        )}
      </Button>
    </Card>
  );
};
