import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Target } from "react-feather";
import { Entry } from "@/hooks/useEntries";
import { useMemo } from "react";

interface KeyInsightsProps {
  entries: Entry[];
}

export const KeyInsights = ({ entries }: KeyInsightsProps) => {
  const insights = useMemo(() => {
    if (entries.length === 0) return null;

    // Current streak
    let currentStreak = 0;
    const now = new Date();
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let lastDate: Date | null = null;
    for (const entry of sortedEntries) {
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

    // Dominant mood
    const moods = entries
      .filter(e => e.mood)
      .map(e => e.mood!.toLowerCase());
    
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantMood = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Week activity
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = entries.filter(e => new Date(e.created_at) >= weekAgo).length;

    return {
      streak: currentStreak,
      dominantMood,
      weekCount
    };
  }, [entries]);

  if (!insights) return null;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <Card className="p-3 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
        <Activity className="w-5 h-5 text-accent mb-2" />
        <div className="text-xl font-bold text-foreground">{insights.streak}</div>
        <div className="text-[10px] text-muted-foreground">day streak</div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
        <TrendingUp className="w-5 h-5 text-primary mb-2" />
        <div className="text-xl font-bold text-foreground">{insights.weekCount}</div>
        <div className="text-[10px] text-muted-foreground">this week</div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
        <Target className="w-5 h-5 text-secondary mb-2" />
        {insights.dominantMood ? (
          <>
            <div className="text-sm font-bold text-foreground capitalize truncate">
              {insights.dominantMood}
            </div>
            <div className="text-[10px] text-muted-foreground">top mood</div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">No mood yet</div>
        )}
      </Card>
    </div>
  );
};
