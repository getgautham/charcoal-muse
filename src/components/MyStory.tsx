import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Entry } from "@/hooks/useEntries";
import { TrendingUp, Activity, Calendar } from "react-feather";
import { EMOTION_COLORS, EmotionKey } from "@/utils/emotionColors";

interface MyStoryProps {
  entries: Entry[];
}

export const MyStory = ({ entries }: MyStoryProps) => {
  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    // Timeline data (last 14 days)
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const timelineData = last14Days.map(date => {
      const dayEntries = entries.filter(e => {
        const entryDate = new Date(e.created_at);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      const moods = dayEntries
        .filter(e => e.mood)
        .map(e => e.mood?.toLowerCase() || '');

      const dominantMood = moods.length > 0 ? moods[0] : null;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayEntries.length,
        mood: dominantMood,
        hasEntry: dayEntries.length > 0
      };
    });

    // Mood distribution
    const moodCounts = entries
      .filter(e => e.mood)
      .reduce((acc, e) => {
        const mood = e.mood!.toLowerCase();
        const mappedMood = EMOTION_COLORS[mood as EmotionKey]?.label || mood;
        acc[mappedMood] = (acc[mappedMood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const totalMoods = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    const moodDistribution = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: (count / totalMoods) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Weekly summary
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekEntries = entries.filter(e => new Date(e.created_at) >= weekAgo);

    return {
      timelineData,
      moodDistribution,
      weekCount: weekEntries.length,
      totalCount: entries.length,
      avgWords: Math.round(entries.reduce((sum, e) => sum + e.content.split(' ').length, 0) / entries.length)
    };
  }, [entries]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Start writing to see your story</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="text-2xl font-bold text-primary">{stats.weekCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">this week</div>
        </Card>
        <Card className="p-3 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <div className="text-2xl font-bold text-accent">{stats.totalCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">all time</div>
        </Card>
        <Card className="p-3 bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
          <div className="text-2xl font-bold text-secondary">{stats.avgWords}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">avg words</div>
        </Card>
      </div>

      {/* Modern Timeline */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Activity</h3>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>2 weeks ago</span>
            <span>today</span>
          </div>
          <div className="flex gap-1">
            {stats.timelineData.map((day, i) => {
              const emotionColor = day.mood ? EMOTION_COLORS[day.mood as EmotionKey] : null;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all hover:scale-110 cursor-pointer"
                  style={{
                    height: `${Math.max(24, day.count * 16)}px`,
                    backgroundColor: day.hasEntry
                      ? emotionColor?.text || 'hsl(var(--primary))'
                      : 'hsl(var(--muted))',
                    opacity: day.hasEntry ? 0.8 : 0.2
                  }}
                  title={`${day.date}: ${day.count} ${day.count === 1 ? 'entry' : 'entries'}`}
                />
              );
            })}
          </div>
        </div>
      </Card>

      {/* Mood Distribution */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Emotional Patterns</h3>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {stats.moodDistribution.slice(0, 6).map((item) => {
            const moodKey = item.mood.toLowerCase() as EmotionKey;
            const color = EMOTION_COLORS[moodKey]?.text || 'hsl(var(--primary))';
            return (
              <div key={item.mood}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium capitalize">{item.mood}</span>
                  <span className="text-xs text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Entries Preview */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Reflections</h3>
        <div className="space-y-3">
          {entries.slice(0, 5).map((entry) => {
            const moodColor = entry.mood
              ? EMOTION_COLORS[entry.mood.toLowerCase() as EmotionKey]
              : null;
            return (
              <div
                key={entry.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {moodColor && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0"
                      style={{
                        borderColor: moodColor.text,
                        color: moodColor.text,
                        backgroundColor: moodColor.bg
                      }}
                    >
                      {moodColor.label}
                    </Badge>
                  )}
                </div>
                <p className="text-sm line-clamp-2 text-foreground/80">
                  {entry.content}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
