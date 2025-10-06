import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LENSES } from "@/types/lens";
import { Memory, LensScores } from "@/hooks/useEntries";
import { Compass as CompassIcon } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading compass...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 pb-24">
      <div className="mb-8">
        <CompassIcon 
          className="w-24 h-24 text-primary"
          style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.05s linear' }}
        />
      </div>

      <h1 className="text-2xl font-bold mb-4 text-center">Your Life Compass</h1>
      
      <div className="card-brutal p-6 max-w-md">
        <p className="text-sm text-foreground leading-relaxed">
          {summaryText}
        </p>
      </div>

      <div className="mt-8 space-y-2 max-w-md">
        {LENSES.map((lens) => (
          <div key={lens.id} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: lens.color }}
            />
            <span className="text-sm font-medium text-foreground">{lens.label}</span>
            <span className="text-sm text-muted-foreground ml-auto capitalize">
              {summary[lens.id] || 'steady'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
