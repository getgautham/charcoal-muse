import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LENSES, LensType } from "@/types/lens";
import { ChevronRight, Loader2, Eye } from "lucide-react";

interface LensInsight {
  lens: string;
  signal: string;
  interpretation: string;
  created_at: string;
}

export const Lens = () => {
  const [insights, setInsights] = useState<Record<string, LensInsight[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      if (data) {
        const grouped = data.reduce((acc, insight) => {
          if (!acc[insight.lens]) acc[insight.lens] = [];
          if (acc[insight.lens].length < 3) {
            acc[insight.lens].push(insight as LensInsight);
          }
          return acc;
        }, {} as Record<string, LensInsight[]>);

        setInsights(grouped);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAnyInsights = Object.keys(insights).length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading lenses...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Five Lenses</h1>
        <p className="text-sm text-muted-foreground">
          View patterns in your memories through five dimensions
        </p>
      </div>
      
      {!hasAnyInsights && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Eye className="w-16 h-16 text-muted-foreground/20" />
          <div className="text-center space-y-2 max-w-xs">
            <p className="text-lg font-semibold text-foreground">No insights yet</p>
            <p className="text-sm text-muted-foreground/60">
              Keep capturing memories to unlock lens insights
            </p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {LENSES.map((lens) => (
          <div
            key={lens.id}
            className="card-brutal p-4"
            style={{ borderColor: lens.color }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: lens.color }}
                />
                <div>
                  <h3 className="font-bold text-foreground">{lens.label}</h3>
                  <p className="text-xs text-muted-foreground">{lens.essence}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              {insights[lens.id]?.slice(0, 3).map((insight, idx) => (
                <div key={idx} className="text-sm text-foreground">
                  {insight.interpretation}
                </div>
              )) || (
                <p className="text-xs text-muted-foreground italic">No insights yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
