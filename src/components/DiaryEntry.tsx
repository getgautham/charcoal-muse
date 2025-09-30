import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useEntries } from "@/hooks/useEntries";
import { Send, Zap, Activity } from "react-feather";

interface DiaryEntryProps {
  onEntryCreated: () => void;
}

const DiaryEntry = ({ onEntryCreated }: DiaryEntryProps) => {
  const [content, setContent] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [promptText, setPromptText] = useState("");
  const { toast } = useToast();
  const preferences = useUserPreferences();
  const { entries } = useEntries();

  useEffect(() => {
    loadDailyPrompt();
  }, []);

  const loadDailyPrompt = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-diary-assistant', {
        body: { 
          action: 'prompt',
          preferences 
        }
      });
      if (error) throw error;
      setPromptText(data.result);
    } catch (error) {
      console.error('Error loading prompt:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      setShowPrompt(false);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get recent entries for context
      const recentEntries = entries.slice(0, 5).map(e => ({
        mood: e.mood,
        created_at: e.created_at
      }));

      // Analyze mood and get insights simultaneously with personalization
      const [moodResponse, insightsResponse] = await Promise.all([
        supabase.functions.invoke('ai-diary-assistant', {
          body: { action: 'mood', content }
        }),
        supabase.functions.invoke('ai-diary-assistant', {
          body: { 
            action: 'insights', 
            content,
            preferences,
            recentEntries 
          }
        })
      ]);

      if (moodResponse.error) throw moodResponse.error;
      if (insightsResponse.error) throw insightsResponse.error;

      const detectedMood = moodResponse.data.result.trim().toLowerCase();
      const insights = insightsResponse.data.result;

      setMood(detectedMood);
      setAiResponse(insights);

      // Save to database
      const { error: saveError } = await supabase.from('diary_entries').insert({
        user_id: user.id,
        title: null,
        content: content.trim(),
        mood: detectedMood,
        ai_insights: insights,
      });

      if (saveError) throw saveError;

      toast({
        title: "✨ Saved",
        description: preferences.displayName 
          ? `Nice one, ${preferences.displayName}!` 
          : "You're doing great!",
      });

      onEntryCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewEntry = () => {
    setContent("");
    setAiResponse("");
    setMood("");
    setShowPrompt(true);
    loadDailyPrompt();
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-card">
      <CardContent className="p-6">
        {showPrompt && promptText && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
            <Activity className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 italic">{promptText}</p>
          </div>
        )}

        {!aiResponse ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="What's going on with you?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="border-border/50 bg-background/50 resize-none text-base"
              disabled={loading}
              autoFocus
            />
            
            <Button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-12 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 animate-pulse" />
                  Reading between the lines...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send
                </span>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mood Badge - More Prominent */}
            {mood && (
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-accent/10 border border-accent/30">
                <span className="text-base text-muted-foreground">Energy:</span>
                <Badge className="bg-accent/20 text-accent border-accent/30 capitalize text-base px-4 py-1.5">
                  {mood}
                </Badge>
              </div>
            )}

            {/* AI Insights - Main Focus */}
              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-3 text-lg">What this tells me</h4>
                  <p className="text-foreground/90 text-base leading-relaxed">{aiResponse}</p>
                </div>
              </div>
            </div>

            {/* Single CTA */}
            <Button
              onClick={handleNewEntry}
              className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 h-12 text-base"
            >
              Write Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiaryEntry;
