import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LENSES, LensType } from "@/types/lens";
import { Loader2, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LensAnalytics {
  frequency: number;
  average_intensity: number;
  trend: number;
  count: number;
}

interface AIInsight {
  insight: string;
  dominant_lens: string;
  neglected_lens: string;
}

export const Lens = () => {
  const [analytics, setAnalytics] = useState<Record<string, LensAnalytics>>({});
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLens, setSelectedLens] = useState<string | null>(null);

  useEffect(() => {
    loadLensAnalytics();
  }, []);

  const loadLensAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get memories from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: memories, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (memories && memories.length > 0) {
        // Calculate analytics for each lens
        const lensData: Record<string, LensAnalytics> = {};
        const totalMemories = memories.length;

        LENSES.forEach(lens => {
          const lensScores = memories
            .map(m => (m.lens_scores as any)?.[lens.id] || 0)
            .filter(score => score > 0);

          const count = lensScores.length;
          const frequency = count / totalMemories;
          const average_intensity = count > 0 
            ? lensScores.reduce((a, b) => a + b, 0) / count 
            : 0;

          // Calculate trend (compare first half vs second half)
          const midpoint = Math.floor(memories.length / 2);
          const recentScores = memories.slice(0, midpoint)
            .map(m => (m.lens_scores as any)?.[lens.id] || 0);
          const olderScores = memories.slice(midpoint)
            .map(m => (m.lens_scores as any)?.[lens.id] || 0);

          const recentAvg = recentScores.length > 0
            ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
            : 0;
          const olderAvg = olderScores.length > 0
            ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
            : 0;

          const trend = recentAvg - olderAvg;

          lensData[lens.id] = { frequency, average_intensity, trend, count };
        });

        setAnalytics(lensData);

        // Generate AI insight
        try {
          const { data: insightData, error: insightError } = await supabase.functions.invoke('lens-insight', {
            body: { summary: lensData }
          });

          if (!insightError && insightData) {
            setAiInsight(insightData);
          }
        } catch (err) {
          console.error('Error generating AI insight:', err);
        }
      }
    } catch (error) {
      console.error('Error loading lens analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasData = Object.keys(analytics).length > 0;

  const getTrendIcon = (trend: number) => {
    if (trend > 0.05) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < -0.05) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendLabel = (trend: number) => {
    if (trend > 0.05) return "rising";
    if (trend < -0.05) return "fading";
    return "steady";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analyzing your lenses...</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 gap-4">
        <Eye className="w-16 h-16 text-muted-foreground/20" />
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-lg font-semibold text-foreground">No lens data yet</p>
          <p className="text-sm text-muted-foreground/60">
            Keep capturing memories to see patterns emerge across your five lenses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Your Life Through the Lenses</h1>
        <p className="text-sm text-muted-foreground">
          Where your attention goes, your life grows
        </p>
      </div>

      {aiInsight && (
        <div className="card-brutal p-4 mb-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <p className="text-sm text-foreground leading-relaxed italic">
            "{aiInsight.insight}"
          </p>
          <div className="flex gap-2 mt-3 text-xs text-muted-foreground">
            <span>Dominant: {aiInsight.dominant_lens}</span>
            {aiInsight.neglected_lens && (
              <>
                <span>•</span>
                <span>Quiet: {aiInsight.neglected_lens}</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {LENSES.map((lens) => {
          const data = analytics[lens.id];
          if (!data) return null;

          const percentage = Math.round(data.frequency * 100);
          const intensity = Math.round(data.average_intensity * 100);

          return (
            <div
              key={lens.id}
              className="card-brutal p-5 cursor-pointer hover:shadow-lg transition-all"
              style={{ borderColor: lens.color }}
              onClick={() => setSelectedLens(selectedLens === lens.id ? null : lens.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: lens.color }}
                  />
                  <div>
                    <h3 className="font-bold text-foreground">{lens.label}</h3>
                    <p className="text-xs text-muted-foreground">{lens.essence}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(data.trend)}
                  <span className="text-xs text-muted-foreground capitalize">
                    {getTrendLabel(data.trend)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold" style={{ color: lens.color }}>
                    {percentage}%
                  </div>
                  <div className="text-xs text-muted-foreground">Frequency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: lens.color }}>
                    {intensity}%
                  </div>
                  <div className="text-xs text-muted-foreground">Intensity</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: lens.color }}>
                    {data.count}
                  </div>
                  <div className="text-xs text-muted-foreground">Mentions</div>
                </div>
              </div>

              {selectedLens === lens.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    {data.frequency < 0.1 
                      ? `${lens.label} rarely appears in your memories. This part of you is waiting.`
                      : data.frequency > 0.4
                      ? `${lens.label} dominates your story. ${lens.essence} fills your days.`
                      : `${lens.label} appears steadily. ${lens.essence} weaves through your life.`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
