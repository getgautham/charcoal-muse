import { useMemo } from "react";
import { format, subDays, startOfWeek, addDays } from "date-fns";
import { Entry } from "@/hooks/useEntries";

interface ActivityHeatmapProps {
  entries: Entry[];
}

export const ActivityHeatmap = ({ entries }: ActivityHeatmapProps) => {
  const heatmapData = useMemo(() => {
    const weeks = 8;
    const today = new Date();
    const startDate = subDays(today, weeks * 7);
    
    const data: { date: Date; count: number }[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => 
        format(new Date(e.created_at), 'yyyy-MM-dd') === dateStr
      );
      data.push({ date, count: dayEntries.length });
    }

    // Organize into weeks
    const weekData: { date: Date; count: number }[][] = [];
    for (let i = 0; i < weeks; i++) {
      weekData.push(data.slice(i * 7, (i + 1) * 7));
    }

    return weekData;
  }, [entries]);

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    if (count === 1) return 'bg-primary/30';
    if (count === 2) return 'bg-primary/50';
    if (count >= 3) return 'bg-primary/80';
    return 'bg-muted/30';
  };

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1 items-center text-xs text-muted-foreground mb-1">
        <span className="w-8"></span>
        {heatmapData.map((week, i) => (
          <div key={i} className="flex-1 text-center">
            {i % 2 === 0 && format(week[0].date, 'MMM')}
          </div>
        ))}
      </div>
      
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground justify-around py-1">
          {days.map((day, i) => (
            <div key={i} className="h-3 flex items-center justify-center">{day}</div>
          ))}
        </div>
        
        {heatmapData.map((week, weekIdx) => (
          <div key={weekIdx} className="flex-1 flex flex-col gap-1">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={`h-3 rounded-sm ${getIntensity(day.count)} transition-colors hover:ring-1 hover:ring-primary/50`}
                title={`${format(day.date, 'MMM d')}: ${day.count} ${day.count === 1 ? 'entry' : 'entries'}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-2">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/50" />
          <div className="w-3 h-3 rounded-sm bg-primary/80" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
