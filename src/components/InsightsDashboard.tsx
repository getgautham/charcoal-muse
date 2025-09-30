import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Entry } from "@/hooks/useEntries";
import { TrendingUp } from "react-feather";

interface InsightsDashboardProps {
  entries: Entry[];
}

export const InsightsDashboard = ({ entries }: InsightsDashboardProps) => {
  const insights = useMemo(() => {
    if (entries.length === 0) return null;

    // Get recent entries (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentEntries = entries.filter(e => new Date(e.created_at) >= weekAgo);

    // Mood analysis
    const moods = entries
      .filter(e => e.mood)
      .map(e => e.mood!.toLowerCase());
    
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantMood = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Pattern detection in content
    const allContent = entries.map(e => e.content.toLowerCase()).join(' ');
    const themes = detectThemes(allContent);

    // Recent activity
    const avgWordsPerEntry = entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.content.split(' ').length, 0) / entries.length)
      : 0;

    return {
      totalEntries: entries.length,
      recentEntries: recentEntries.length,
      dominantMood,
      themes,
      avgWordsPerEntry,
      mostRecentInsight: entries[0]?.ai_insights,
    };
  }, [entries]);

  if (!insights) {
    return null;
  }

  return (
    <Card className="p-3 h-full">
      <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Quick Stats</h2>
      
      <div className="space-y-3">
        {/* Dominant Mood */}
        {insights.dominantMood && (
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/30">
            <p className="text-[10px] text-muted-foreground mb-0.5">Top Mood</p>
            <p className="text-xs font-semibold capitalize truncate">{insights.dominantMood}</p>
          </div>
        )}
        
        {/* Entry Count */}
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-[10px] text-muted-foreground mb-0.5">Total</p>
          <p className="text-xs font-semibold">{insights.totalEntries}</p>
        </div>

        {/* Avg Words */}
        <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/30">
          <p className="text-[10px] text-muted-foreground mb-0.5">Avg Words</p>
          <p className="text-xs font-semibold">{Math.round(insights.avgWordsPerEntry)}</p>
        </div>

        {/* Recent Entries */}
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/30">
          <p className="text-[10px] text-muted-foreground mb-0.5">This Week</p>
          <p className="text-xs font-semibold">{insights.recentEntries}</p>
        </div>
      </div>
    </Card>
  );
};

// Simple theme detection based on keyword frequency
const detectThemes = (text: string): string[] => {
  const keywords = {
    'work': ['work', 'job', 'career', 'project', 'meeting', 'boss', 'colleague'],
    'relationships': ['friend', 'family', 'love', 'partner', 'relationship', 'together'],
    'growth': ['learn', 'grow', 'improve', 'change', 'better', 'progress'],
    'health': ['health', 'exercise', 'sleep', 'body', 'energy', 'workout'],
    'creativity': ['create', 'art', 'music', 'write', 'design', 'project'],
    'reflection': ['think', 'feel', 'realize', 'understand', 'wonder', 'question'],
  };

  const themes: string[] = [];
  for (const [theme, words] of Object.entries(keywords)) {
    const count = words.reduce((sum, word) => {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
      return sum + (text.match(regex)?.length || 0);
    }, 0);
    
    if (count >= 3) {
      themes.push(theme);
    }
  }

  return themes.slice(0, 3); // Only show 3 for mobile
};
