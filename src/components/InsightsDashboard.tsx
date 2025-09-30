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
    <Card className="p-4">
      <h2 className="text-base font-semibold mb-3">Quick Insights</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Dominant Mood */}
        {insights.dominantMood && (
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
            <p className="text-xs text-muted-foreground mb-1">Most Common</p>
            <p className="text-sm font-semibold capitalize">{insights.dominantMood}</p>
          </div>
        )}
        
        {/* Entry Count */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
          <p className="text-sm font-semibold">{insights.totalEntries}</p>
        </div>

        {/* Avg Words */}
        <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">Avg Words</p>
          <p className="text-sm font-semibold">{Math.round(insights.avgWordsPerEntry)}</p>
        </div>

        {/* Recent Entries */}
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
          <p className="text-xs text-muted-foreground mb-1">This Week</p>
          <p className="text-sm font-semibold">{insights.recentEntries}</p>
        </div>
      </div>

      {/* Themes */}
      {insights.themes.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">Your Themes</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.themes.map((theme, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5 border-primary/30">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest AI Insight - Mobile Optimized */}
      {insights.mostRecentInsight && (
        <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-2">Latest Insight</p>
          <p className="text-sm leading-relaxed">{insights.mostRecentInsight}</p>
        </div>
      )}
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
