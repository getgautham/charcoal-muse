import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Entry } from "@/hooks/useEntries";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Activity, TrendingUp } from "react-feather";

interface EmotionalTimelineProps {
  entries: Entry[];
}

const EMOTION_MAPPING = {
  // Ekman's 6 core emotions
  happiness: { value: 8, color: 'hsl(48, 96%, 53%)', label: 'Happiness' },
  sadness: { value: 2, color: 'hsl(221, 83%, 53%)', label: 'Sadness' },
  fear: { value: 3, color: 'hsl(280, 60%, 50%)', label: 'Fear' },
  anger: { value: 3, color: 'hsl(0, 72%, 51%)', label: 'Anger' },
  surprise: { value: 7, color: 'hsl(168, 76%, 42%)', label: 'Surprise' },
  disgust: { value: 2, color: 'hsl(88, 50%, 53%)', label: 'Disgust' },
  
  // Extended emotions mapped to Ekman's core
  happy: { value: 8, color: 'hsl(48, 96%, 53%)', label: 'Happiness' },
  sad: { value: 2, color: 'hsl(221, 83%, 53%)', label: 'Sadness' },
  anxious: { value: 3, color: 'hsl(280, 60%, 50%)', label: 'Fear' },
  calm: { value: 7, color: 'hsl(168, 76%, 42%)', label: 'Calm' },
  excited: { value: 8, color: 'hsl(48, 96%, 53%)', label: 'Happiness' },
  frustrated: { value: 3, color: 'hsl(0, 72%, 51%)', label: 'Anger' },
  grateful: { value: 8, color: 'hsl(48, 96%, 53%)', label: 'Happiness' },
  peaceful: { value: 7, color: 'hsl(168, 76%, 42%)', label: 'Calm' },
  reflective: { value: 6, color: 'hsl(168, 76%, 42%)', label: 'Reflective' },
  hopeful: { value: 7, color: 'hsl(48, 96%, 53%)', label: 'Happiness' },
  overwhelmed: { value: 3, color: 'hsl(280, 60%, 50%)', label: 'Fear' },
  content: { value: 7, color: 'hsl(48, 96%, 53%)', label: 'Happiness' },
} as const;

export const EmotionalTimeline = ({ entries }: EmotionalTimelineProps) => {
  const timelineData = useMemo(() => {
    return entries
      .filter(e => e.mood)
      .slice(0, 30)
      .reverse()
      .map((entry, index) => {
        const mood = entry.mood?.toLowerCase() || '';
        const emotionData = EMOTION_MAPPING[mood as keyof typeof EMOTION_MAPPING] || { value: 5, color: 'hsl(var(--primary))', label: mood };
        
        return {
          date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: entry.created_at,
          value: emotionData.value,
          mood: emotionData.label,
          color: emotionData.color,
          content: entry.content.substring(0, 100)
        };
      });
  }, [entries]);

  const dominantMood = useMemo(() => {
    const moodCounts = new Map<string, number>();
    entries.forEach(e => {
      if (e.mood) {
        const mood = e.mood.toLowerCase();
        const mapped = EMOTION_MAPPING[mood as keyof typeof EMOTION_MAPPING];
        if (mapped) {
          moodCounts.set(mapped.label, (moodCounts.get(mapped.label) || 0) + 1);
        }
      }
    });
    const sorted = Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0];
  }, [entries]);

  if (timelineData.length === 0) {
    return (
      <Card className="p-6">
        <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <h3 className="text-base font-medium text-center mb-1">Your Story</h3>
        <p className="text-sm text-muted-foreground text-center">
          Start writing to see your emotional journey
        </p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.mood}</p>
          <p className="text-xs text-muted-foreground mb-2">{data.date}</p>
          <p className="text-xs">{data.content}...</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Your Story</h2>
          <p className="text-xs text-muted-foreground">Last 30 entries</p>
        </div>
        {dominantMood && (
          <Badge 
            className="text-xs px-2 py-1"
            style={{
              backgroundColor: `${EMOTION_MAPPING[dominantMood[0].toLowerCase() as keyof typeof EMOTION_MAPPING]?.color || 'hsl(var(--primary))'}20`,
              color: EMOTION_MAPPING[dominantMood[0].toLowerCase() as keyof typeof EMOTION_MAPPING]?.color || 'hsl(var(--primary))',
              borderColor: EMOTION_MAPPING[dominantMood[0].toLowerCase() as keyof typeof EMOTION_MAPPING]?.color || 'hsl(var(--primary))'
            }}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            {dominantMood[0]}
          </Badge>
        )}
      </div>

      <div className="h-[280px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, 10]}
              ticks={[2, 5, 8]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fill="url(#emotionGradient)"
              dot={{ 
                fill: 'hsl(var(--primary))', 
                strokeWidth: 2, 
                r: 4,
                stroke: 'hsl(var(--background))'
              }}
              activeDot={{ 
                r: 6, 
                strokeWidth: 2,
                stroke: 'hsl(var(--background))'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[hsl(48,96%,53%)]" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[hsl(168,76%,42%)]" />
          <span>Mid</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[hsl(221,83%,53%)]" />
          <span>Low</span>
        </div>
      </div>
    </Card>
  );
};
