import { useMemo } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { Entry } from "@/hooks/useEntries";

interface MoodChartProps {
  entries: Entry[];
  visualStyle: string;
}

export const MoodChart = ({ entries, visualStyle }: MoodChartProps) => {
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    // Get last 14 days
    const days = 14;
    const moodValues: Record<string, number> = {
      happy: 5,
      excited: 5,
      hopeful: 4,
      grateful: 4,
      content: 3,
      calm: 3,
      reflective: 3,
      peaceful: 3,
      anxious: 2,
      frustrated: 2,
      overwhelmed: 1,
      sad: 1,
    };

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayEntries = entries.filter(e => 
        format(new Date(e.created_at), 'yyyy-MM-dd') === dateStr
      );

      if (dayEntries.length > 0) {
        const avgMood = dayEntries.reduce((sum, e) => {
          return sum + (moodValues[e.mood?.toLowerCase() || 'calm'] || 3);
        }, 0) / dayEntries.length;

        data.push({
          date: format(date, 'MMM d'),
          mood: Math.round(avgMood * 10) / 10,
          entries: dayEntries.length,
        });
      } else {
        data.push({
          date: format(date, 'MMM d'),
          mood: null,
          entries: 0,
        });
      }
    }

    return data.filter(d => d.mood !== null);
  }, [entries]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Need a few more entries to see patterns
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-xs text-muted-foreground">
            Mood: {payload[0].value}/5
          </p>
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.entries} {payload[0].payload.entries === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      );
    }
    return null;
  };

  if (visualStyle === 'minimal') {
    return (
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (visualStyle === 'balanced') {
    return (
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 5]} 
              hide
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="mood" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorMood)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Detailed view
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMoodDetailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 5]}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
            ticks={[1, 2, 3, 4, 5]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="mood" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorMoodDetailed)"
            dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
