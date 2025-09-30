import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Entry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  ai_insights: string | null;
  created_at: string;
  updated_at: string;
}

export const useEntries = (refreshKey: number = 0) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [refreshKey]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading, reload: loadEntries };
};
