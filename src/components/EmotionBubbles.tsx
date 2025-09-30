import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Entry } from "@/hooks/useEntries";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Activity } from "react-feather";

interface EmotionBubblesProps {
  entries: Entry[];
}

const EKMAN_EMOTIONS = {
  happiness: { color: 'hsl(48, 96%, 53%)', label: 'Happiness', description: 'Joy & contentment' },
  sadness: { color: 'hsl(221, 83%, 53%)', label: 'Sadness', description: 'Sorrow & loss' },
  fear: { color: 'hsl(280, 60%, 50%)', label: 'Fear', description: 'Threat awareness' },
  anger: { color: 'hsl(0, 72%, 51%)', label: 'Anger', description: 'Boundary violation' },
  surprise: { color: 'hsl(168, 76%, 42%)', label: 'Surprise', description: 'Unexpected events' },
  disgust: { color: 'hsl(88, 50%, 53%)', label: 'Disgust', description: 'Rejection response' }
} as const;

type EmotionKey = keyof typeof EKMAN_EMOTIONS;

export const EmotionBubbles = ({ entries }: EmotionBubblesProps) => {
  const emotionData = useMemo(() => {
    const counts = new Map<string, { count: number; recent: string }>();
    
    entries.forEach(entry => {
      if (entry.mood) {
        const mood = entry.mood.toLowerCase();
        const existing = counts.get(mood);
        if (existing) {
          existing.count++;
        } else {
          counts.set(mood, { count: 1, recent: entry.created_at });
        }
      }
    });

    return Array.from(counts.entries())
      .map(([emotion, data]) => ({
        emotion,
        count: data.count,
        recent: data.recent,
        percentage: (data.count / entries.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  const dominantEmotion = emotionData[0];
  const totalEntries = entries.filter(e => e.mood).length;

  if (totalEntries === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Your Emotional Landscape</h3>
        <p className="text-muted-foreground">
          Start writing to see your emotions visualized
        </p>
      </Card>
    );
  }

  const maxSize = 180;
  const minSize = 60;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Emotional Core</h2>
          <p className="text-sm text-muted-foreground">Based on Ekman's survival emotions</p>
        </div>
        {dominantEmotion && (
          <Badge 
            className="text-sm px-3 py-1"
            style={{ 
              backgroundColor: `${EKMAN_EMOTIONS[dominantEmotion.emotion as EmotionKey]?.color || 'hsl(var(--primary))'}20`,
              color: EKMAN_EMOTIONS[dominantEmotion.emotion as EmotionKey]?.color || 'hsl(var(--primary))',
              borderColor: EKMAN_EMOTIONS[dominantEmotion.emotion as EmotionKey]?.color || 'hsl(var(--primary))'
            }}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            {EKMAN_EMOTIONS[dominantEmotion.emotion as EmotionKey]?.label || dominantEmotion.emotion}
          </Badge>
        )}
      </div>

      <TooltipProvider>
        <div className="relative h-[400px] flex items-center justify-center flex-wrap gap-4 p-4">
          {emotionData.map((data, index) => {
            const emotionInfo = EKMAN_EMOTIONS[data.emotion as EmotionKey];
            if (!emotionInfo) return null;

            const size = minSize + (data.percentage / 100) * (maxSize - minSize);
            const delay = index * 100;

            return (
              <Tooltip key={data.emotion}>
                <TooltipTrigger asChild>
                  <div
                    className="relative cursor-pointer transition-all duration-300 hover:scale-110"
                    style={{
                      width: size,
                      height: size,
                      animation: `pulse 3s ease-in-out infinite ${delay}ms`
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full flex flex-col items-center justify-center text-center p-4"
                      style={{
                        backgroundColor: `${emotionInfo.color}25`,
                        border: `2px solid ${emotionInfo.color}`,
                        boxShadow: `0 0 30px ${emotionInfo.color}40`
                      }}
                    >
                      <span 
                        className="font-semibold text-sm mb-1"
                        style={{ color: emotionInfo.color }}
                      >
                        {emotionInfo.label}
                      </span>
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: emotionInfo.color }}
                      >
                        {data.count}
                      </span>
                      <span 
                        className="text-xs opacity-80"
                        style={{ color: emotionInfo.color }}
                      >
                        {data.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  className="max-w-[200px]"
                  style={{ 
                    backgroundColor: `${emotionInfo.color}15`,
                    borderColor: emotionInfo.color
                  }}
                >
                  <p className="font-semibold mb-1">{emotionInfo.label}</p>
                  <p className="text-xs opacity-90 mb-2">{emotionInfo.description}</p>
                  <p className="text-xs opacity-75">
                    Last felt: {new Date(data.recent).toLocaleDateString()}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </Card>
  );
};
