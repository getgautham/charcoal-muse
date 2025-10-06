import { useMemo } from "react";
import { Entry } from "@/hooks/useEntries";
import { LensType, LENS_CONFIG } from "@/types/lens";
import { Card } from "@/components/ui/card";

interface LifePulseProps {
  entries: Entry[];
}

export const LifePulse = ({ entries }: LifePulseProps) => {
  const pulseData = useMemo(() => {
    if (entries.length === 0) return [];

    // Get last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return days.map(date => {
      const dayEntries = entries.filter(e => {
        const entryDate = new Date(e.created_at);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      if (dayEntries.length === 0) return { date, count: 0, lens: null, change: null };

      // Find dominant lens for the day
      const lensCount: Record<LensType, number> = {
        love: 0,
        energy: 0,
        work: 0,
        growth: 0,
        satisfaction: 0
      };

      dayEntries.forEach(entry => {
        if (!entry.lens_insights) return;
        Object.keys(entry.lens_insights).forEach(lens => {
          if (entry.lens_insights![lens as LensType]?.detected) {
            lensCount[lens as LensType]++;
          }
        });
      });

      const dominantLens = (Object.entries(lensCount).sort(([, a], [, b]) => b - a)[0]?.[0] || null) as LensType | null;

      return {
        date,
        count: dayEntries.length,
        lens: dominantLens,
        entry: dayEntries[0] // Most recent entry for the day
      };
    });
  }, [entries]);

  const weeklyTrends = useMemo(() => {
    if (entries.length < 7) return null;

    const recent = entries.slice(0, 7);
    const previous = entries.slice(7, 14);

    const countLens = (entries: Entry[]) => {
      const counts: Record<LensType, number> = {
        love: 0,
        energy: 0,
        work: 0,
        growth: 0,
        satisfaction: 0
      };

      entries.forEach(e => {
        if (!e.lens_insights) return;
        Object.keys(e.lens_insights).forEach(lens => {
          if (e.lens_insights![lens as LensType]?.detected) {
            counts[lens as LensType]++;
          }
        });
      });

      return counts;
    };

    const recentCounts = countLens(recent);
    const prevCounts = countLens(previous);

    const trends: Array<{ lens: LensType; direction: '↑' | '↓' | '→' }> = [];
    Object.keys(LENS_CONFIG).forEach(lens => {
      const key = lens as LensType;
      const diff = recentCounts[key] - prevCounts[key];
      trends.push({
        lens: key,
        direction: diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
      });
    });

    return trends;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-muted-foreground">Start capturing memories to see your life pulse</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 max-w-4xl mx-auto px-4">
      {/* Life Pulse Line */}
      <Card className="p-6 bg-card border-border">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Life Pulse — Last 30 Days
        </div>
        
        {/* Pulse visualization */}
        <div className="relative h-32 flex items-center">
          <svg className="w-full h-full" viewBox="0 0 600 80" preserveAspectRatio="none">
            <polyline
              points={pulseData.map((d, i) => {
                const x = (i / 29) * 600;
                const y = d.count > 0 ? 40 - (d.count * 8) : 40;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            {pulseData.map((d, i) => {
              if (d.count === 0) return null;
              const x = (i / 29) * 600;
              const y = 40 - (d.count * 8);
              const color = d.lens ? LENS_CONFIG[d.lens].color : 'hsl(var(--muted-foreground))';
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  className="transition-all duration-300 hover:r-6 cursor-pointer"
                />
              );
            })}
          </svg>
        </div>

        {/* Weekly Trends */}
        {weeklyTrends && (
          <div className="mt-6 pt-4 border-t-2 border-border">
            <div className="flex gap-3 items-center justify-center">
              {weeklyTrends.map(({ lens, direction }) => {
                const config = LENS_CONFIG[lens];
                return (
                  <div
                    key={lens}
                    className="flex items-center gap-1"
                    title={config.name}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs font-bold">{direction}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Your rhythm this week
            </p>
          </div>
        )}
      </Card>

      {/* Recent Memories Stream */}
      <div className="space-y-3">
        {entries.slice(0, 8).map(entry => {
          const activeLenses = entry.lens_insights
            ? Object.entries(entry.lens_insights)
                .filter(([_, data]) => data?.detected)
                .map(([lens]) => lens as LensType)
            : [];

          const reflection = activeLenses.length > 0 && entry.lens_insights?.[activeLenses[0]]?.signal;

          return (
            <Card
              key={entry.id}
              className="p-4 bg-card border-border hover:shadow-lg transition-all duration-300 animate-fade-in"
            >
              <div className="flex gap-2 mb-2">
                {activeLenses.map(lens => (
                  <div
                    key={lens}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: LENS_CONFIG[lens].color }}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-2">
                {entry.content}
              </p>
              {reflection && (
                <p className="text-xs text-muted-foreground italic">
                  {reflection}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                {new Date(entry.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
