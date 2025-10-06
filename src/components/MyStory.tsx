import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Entry } from "@/hooks/useEntries";
import { Activity, Calendar, Sun } from "react-feather";
import { LensType, LENS_CONFIG } from "@/types/lens";
import { LensFilter } from "./LensFilter";
import { LensInsightDisplay } from "./LensInsightDisplay";

interface MyStoryProps {
  entries: Entry[];
}

export const MyStory = ({ entries }: MyStoryProps) => {
  const [activeLens, setActiveLens] = useState<LensType | 'all'>('all');

  const filteredEntries = useMemo(() => {
    if (activeLens === 'all') return entries;
    return entries.filter(entry => {
      if (!entry.lens_insights) return false;
      const lensData = entry.lens_insights[activeLens];
      return lensData?.detected === true;
    });
  }, [entries, activeLens]);

  const stats = useMemo(() => {
    if (filteredEntries.length === 0) return null;

    // Calculate streak based on filtered entries
    const streak = filteredEntries.filter(e => {
      const diff = Date.now() - new Date(e.created_at).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    // Timeline data (last 30 days for larger view)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const timelineData = last30Days.map(date => {
      const dayEntries = filteredEntries.filter(e => {
        const entryDate = new Date(e.created_at);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      const moods = dayEntries
        .filter(e => e.mood)
        .map(e => e.mood?.toLowerCase() || '');

      const dominantMood = moods.length > 0 ? moods[0] : null;

      return {
        count: dayEntries.length,
        mood: dominantMood,
        hasEntry: dayEntries.length > 0
      };
    });

    // Get dominant lens or mood
    const lensCounts = activeLens !== 'all' 
      ? { [activeLens]: filteredEntries.length }
      : filteredEntries
        .filter(e => e.lens_insights)
        .reduce((acc, e) => {
          Object.keys(e.lens_insights!).forEach(lens => {
            if (e.lens_insights![lens as LensType]?.detected) {
              acc[lens] = (acc[lens] || 0) + 1;
            }
          });
          return acc;
        }, {} as Record<string, number>);

    const dominantPattern = Object.entries(lensCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    return {
      streak,
      dominantPattern,
      timelineData,
      totalCount: filteredEntries.length
    };
  }, [filteredEntries, activeLens]);

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

  const patternConfig = stats.dominantPattern !== 'none' && stats.dominantPattern in LENS_CONFIG
    ? LENS_CONFIG[stats.dominantPattern as LensType]
    : null;

  return (
    <div className="space-y-6 pb-6 max-w-4xl mx-auto px-4">
      {/* Lens Filter */}
      <div className="pt-4">
        <LensFilter activeLens={activeLens} onLensChange={setActiveLens} />
      </div>
      {/* Simplified Large Key Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex flex-col">
            <Calendar className="w-7 h-7 text-primary mb-3" />
            <div className="text-5xl font-bold text-[#333333] mb-1">{stats.streak}</div>
            <div className="text-sm text-[#666666]">Day Streak</div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex flex-col">
            <div 
              className="w-7 h-7 rounded-full mb-3"
              style={{ backgroundColor: patternConfig?.color || 'hsl(var(--primary))' }}
            />
            <div className="text-xl font-bold text-[#333333] capitalize mb-1">
              {patternConfig?.name || 'Pattern'}
            </div>
            <div className="text-sm text-[#666666]">Dominant Lens</div>
          </div>
        </Card>
      </div>

      {/* Large 30-Day Activity Grid */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-[#333333]">Last 30 Days</h3>
        </div>
        <div className="grid grid-cols-10 gap-2">
          {stats.timelineData.map((day, i) => {
            const bgColor = day.count > 0 
              ? 'hsl(var(--primary)/0.3)' 
              : 'hsl(var(--muted)/0.2)';
            
            return (
              <div
                key={i}
                className="aspect-square rounded-lg transition-all duration-300 hover:scale-110"
                style={{ backgroundColor: bgColor }}
              />
            );
          })}
        </div>
      </Card>

      {/* Recent Moments - Larger Cards */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-5">
          <Sun className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-[#333333]">Recent Moments</h3>
        </div>
        <div className="space-y-4">
          {filteredEntries.slice(0, 5).map(entry => {
            return (
              <div key={entry.id} className="p-5 rounded-xl bg-white border border-[#d1d1d1]">
                <p className="text-sm text-[#333333] line-clamp-3 leading-relaxed mb-3">
                  {entry.content}
                </p>
                {entry.lens_insights && (
                  <LensInsightDisplay lensInsights={entry.lens_insights} />
                )}
                <div className="text-xs text-[#666666] mt-3">
                  {new Date(entry.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
