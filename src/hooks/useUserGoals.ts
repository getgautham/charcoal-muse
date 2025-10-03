import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserGoal {
  id: string;
  goal_text: string;
  category?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  completed_at?: string;
  notes?: string;
}

export const useUserGoals = () => {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals((data || []) as UserGoal[]);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const addGoal = async (goalText: string, category?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_goals')
        .insert({ 
          user_id: user.id, 
          goal_text: goalText,
          category,
          status: 'active'
        });

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<UserGoal>) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update(updates)
        .eq('id', goalId);

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  return { goals, loading, addGoal, updateGoal, deleteGoal, refresh: fetchGoals };
};
