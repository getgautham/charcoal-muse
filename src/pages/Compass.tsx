import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LENSES } from "@/types/lens";
import { Memory, LensScores } from "@/hooks/useEntries";
import { Compass as CompassIcon, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CompassData {
  averages: Record<string, number>;
  deltas: Record<string, number>;
}

interface CompassDirection {
  direction: string;
  focus_lens: string;
  tone: string;
}

export const Compass = () => {
  const [compassData, setCompassData] = useState<CompassData | null>(null);
  const [direction, setDirection] = useState<CompassDirection | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingFocus, setSettingFocus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCompassData();
  }, []);

  const loadCompassData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const twentyEightDaysAgo = new Date();
      twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

      // Get recent memories (last 14 days)
      const { data: recentMemories, error: recentError } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', fourteenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (recentError) throw recentError;

      // Get previous period memories (14-28 days ago)
      const { data: previousMemories, error: previousError } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', twentyEightDaysAgo.toISOString())
        .lt('created_at', fourteenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (previousError) throw previousError;

      if (recentMemories && recentMemories.length > 0) {
        const recentMems = recentMemories.map(m => ({
          ...m,
          lens_scores: (m.lens_scores || {}) as any as LensScores
        })) as Memory[];

        const previousMems = (previousMemories || []).map(m => ({
          ...m,
          lens_scores: (m.lens_scores || {}) as any as LensScores
        })) as Memory[];

        // Calculate averages and deltas
        const averages: Record<string, number> = {};
        const deltas: Record<string, number> = {};

        LENSES.forEach(lens => {
          const recentScores = recentMems.map(m => m.lens_scores[lens.id] || 0);
          const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
          averages[lens.id] = recentAvg;

          if (previousMems.length > 0) {
            const previousScores = previousMems.map(m => m.lens_scores[lens.id] || 0);
            const previousAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
            deltas[lens.id] = recentAvg - previousAvg;
          } else {
            deltas[lens.id] = 0;
          }
        });

        setCompassData({ averages, deltas });

        // Generate AI direction
        try {
          const { data: directionData, error: directionError } = await supabase.functions.invoke('compass-direction', {
            body: { 
              averages, 
              deltas,
              top_themes: []
            }
          });

          if (!directionError && directionData) {
            setDirection(directionData);
          }
        } catch (err) {
          console.error('Error generating direction:', err);
        }
      }
    } catch (error) {
      console.error('Error loading compass data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setWeeklyFocus = async () => {
    if (!direction) return;

    setSettingFocus(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_focus')
        .insert({
          user_id: user.id,
          focus_lens: direction.focus_lens,
          direction: direction.direction
        });

      if (error) throw error;

      toast({
        title: "Focus set",
        description: `You're focusing on ${direction.focus_lens} this week`,
      });
    } catch (error) {
      console.error('Error setting focus:', error);
      toast({
        title: "Error",
        description: "Failed to set weekly focus",
        variant: "destructive"
      });
    } finally {
      setSettingFocus(false);
    }
  };

  const hasData = compassData !== null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Reading your compass...</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 gap-4">
        <CompassIcon className="w-16 h-16 text-muted-foreground/20" />
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-lg font-semibold text-foreground">Compass calibrating</p>
          <p className="text-sm text-muted-foreground/60">
            Write a few more memories to see your directional guidance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6 pb-24">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Your Compass</h1>
        <p className="text-sm text-muted-foreground">
          Where your life is pointing
        </p>
      </div>

      {direction && (
        <div className="card-brutal p-6 mb-8 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-start gap-3 mb-4">
            <CompassIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <p className="text-base text-foreground leading-relaxed">
              {direction.direction}
            </p>
          </div>
          <Button 
            onClick={setWeeklyFocus}
            disabled={settingFocus}
            className="w-full"
            style={{
              background: `linear-gradient(135deg, ${LENSES.find(l => l.id === direction.focus_lens)?.color}40, ${LENSES.find(l => l.id === direction.focus_lens)?.color}20)`
            }}
          >
            <Target className="w-4 h-4 mr-2" />
            {settingFocus ? "Setting..." : `Focus on ${direction.focus_lens} this week`}
          </Button>
        </div>
      )}

      {compassData && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground mb-3">Recent Patterns</h3>
            <div className="space-y-3">
              {LENSES.map((lens) => {
                const avg = compassData.averages[lens.id] || 0;
                const delta = compassData.deltas[lens.id] || 0;
                const percentage = Math.round(avg * 100);

                return (
                  <div key={lens.id} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: lens.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{lens.label}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: lens.color 
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground w-16 text-right">
                      {delta > 0.05 ? '↑ rising' : delta < -0.05 ? '↓ fading' : '→ steady'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
