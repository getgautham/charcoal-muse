import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LENSES } from "@/types/lens";
import { Memory, LensScores } from "@/hooks/useEntries";
import { Compass as CompassIcon, Loader2 } from "lucide-react";

export const Compass = () => {
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    loadSummary();
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const loadSummary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data) {
        const memories = data.map(m => ({
          ...m,
          lens_scores: (m.lens_scores || {}) as any as LensScores
        })) as Memory[];
        const lensAverages = LENSES.reduce((acc, lens) => {
          const scores = memories.map(m => m.lens_scores[lens.id] || 0);
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          
          let trend = 'steady';
          if (avg > 0.6) trend = 'rising';
          else if (avg > 0.4) trend = 'steady';
          else if (avg > 0.2) trend = 'soft';
          else trend = 'quiet';

          acc[lens.id] = trend;
          return acc;
        }, {} as Record<string, string>);

        setSummary(lensAverages);
      }
    } catch (error) {
      console.error('Error loading compass:', error);
    } finally {
      setLoading(false);
    }
  };

  const summaryText = LENSES.map(lens => `${lens.label} ${summary[lens.id] || 'steady'}`).join(' • ');
  const hasData = Object.keys(summary).length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading compass...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 pb-24">
      <div className="mb-8">
        <CompassIcon 
          className="w-24 h-24 text-primary"
          style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.05s linear' }}
        />
      </div>

      <h1 className="text-2xl font-bold mb-2 text-center">Your Life Compass</h1>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        See your direction: what's rising, what's fading
      </p>
      
      {hasData ? (
        <>
          <div className="card-brutal p-6 max-w-md mb-8">
            <p className="text-sm text-foreground leading-relaxed text-center">
              {summaryText}
            </p>
          </div>

          <div className="space-y-3 max-w-md w-full">
            {LENSES.map((lens) => (
              <div key={lens.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: lens.color }}
                />
                <span className="text-sm font-medium text-foreground">{lens.label}</span>
                <span className="text-sm text-muted-foreground ml-auto capitalize font-semibold">
                  {summary[lens.id] || 'steady'}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground/60 max-w-xs">
          <p className="text-sm">Not enough data yet to show your compass</p>
          <p className="text-xs mt-2">Keep capturing memories to see your direction</p>
        </div>
      )}
    </div>
  );
};
