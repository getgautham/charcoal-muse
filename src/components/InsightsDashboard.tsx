import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Entry } from "@/hooks/useEntries";
import { SparklesIcon, ChartBarIcon, HeartIcon } from "@heroicons/react/24/outline";

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
    const avgWordsPerEntry = recentEntries.length > 0
      ? Math.round(recentEntries.reduce((sum, e) => sum + e.content.split(' ').length, 0) / recentEntries.length)
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
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Write a few entries to see patterns about yourself
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-accent" />
          What I'm Learning About You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood Pattern */}
        {insights.dominantMood && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-start gap-3">
              <HeartIcon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">Your Energy Lately</h4>
                <p className="text-sm text-muted-foreground">
                  You've been feeling mostly{' '}
                  <Badge className="bg-accent/20 text-accent border-accent/30 mx-1">
                    {insights.dominantMood}
                  </Badge>
                  {' '}based on your recent entries
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Themes */}
        {insights.themes.length > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <ChartBarIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-2">What You're Thinking About</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.themes.map((theme, i) => (
                    <Badge key={i} variant="outline" className="bg-primary/5 border-primary/30">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background/50 border border-border/30">
            <div className="text-2xl font-bold text-foreground">{insights.recentEntries}</div>
            <div className="text-xs text-muted-foreground">entries this week</div>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/30">
            <div className="text-2xl font-bold text-foreground">{insights.avgWordsPerEntry}</div>
            <div className="text-xs text-muted-foreground">avg words/entry</div>
          </div>
        </div>

        {/* Latest Deep Insight */}
        {insights.mostRecentInsight && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Latest insight</p>
            <p className="text-sm text-foreground/90 italic leading-relaxed">
              "{insights.mostRecentInsight}"
            </p>
          </div>
        )}
      </CardContent>
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

  return themes.slice(0, 4);
};
