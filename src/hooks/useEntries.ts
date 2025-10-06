import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LensScores {
  love: number;
  energy: number;
  work: number;
  growth: number;
  satisfaction: number;
}

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  lens_scores: LensScores;
  dominant_lens: string | null;
  sentiment: number | null;
  mood: string | null;
  created_at: string;
}

export const useEntries = (refreshKey: number = 0) => {
  const [entries, setEntries] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [refreshKey]);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setEntries(data.map(m => ({
          ...m,
          lens_scores: (m.lens_scores || {}) as any as LensScores
        })) as Memory[]);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading, refresh: loadEntries };
};
