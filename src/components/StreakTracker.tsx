import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Target, TrendingUp } from "react-feather";

const StreakTracker = () => {
  const [streak, setStreak] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: entries } = await supabase
        .from('diary_entries')
        .select('created_at')
        .order('created_at', { ascending: false });

      if (!entries || entries.length === 0) return;

      setTotalEntries(entries.length);

      // Calculate streak
      const now = new Date();
      let currentStreak = 0;
      let lastDate: Date | null = null;

      for (const entry of entries) {
        const entryDate = new Date(entry.created_at);
        entryDate.setHours(0, 0, 0, 0);

        if (!lastDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (entryDate.getTime() === today.getTime() || 
              entryDate.getTime() === yesterday.getTime()) {
            currentStreak = 1;
            lastDate = entryDate;
          } else {
            break;
          }
        } else {
          const expectedDate = new Date(lastDate);
          expectedDate.setDate(expectedDate.getDate() - 1);

          if (entryDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
            lastDate = entryDate;
          } else {
            break;
          }
        }
      }

      setStreak(currentStreak);

      // Calculate this week's entries
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekCount = entries.filter(
        e => new Date(e.created_at) >= weekAgo
      ).length;
      setThisWeek(weekCount);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-card">
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className={`w-8 h-8 ${streak > 0 ? 'text-accent' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{streak}</div>
            <div className="text-xs text-muted-foreground">days in a row</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{thisWeek}</div>
            <div className="text-xs text-muted-foreground">past 7 days</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-8 h-8 text-accent" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalEntries}</div>
            <div className="text-xs text-muted-foreground">all time</div>
          </div>
        </div>

        {streak > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30">
            <p className="text-sm text-center text-foreground font-medium">
              {streak === 1 && "Nice! You showed up today 🙌"}
              {streak >= 2 && streak < 7 && `${streak} days! You're on a roll 🔥`}
              {streak >= 7 && streak < 30 && `Damn, ${streak} days straight! Keep vibing ⭐`}
              {streak >= 30 && `${streak} days?! You're crushing it 🏆`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreakTracker;
