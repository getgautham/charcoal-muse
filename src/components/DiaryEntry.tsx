import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Sparkles, Lightbulb } from "lucide-react";

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

  useEffect(() => {
    loadDailyPrompt();
  }, []);

  const loadDailyPrompt = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-diary-assistant', {
        body: { action: 'prompt' }
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

      // Analyze mood and get insights simultaneously
      const [moodResponse, insightsResponse] = await Promise.all([
        supabase.functions.invoke('ai-diary-assistant', {
          body: { action: 'mood', content }
        }),
        supabase.functions.invoke('ai-diary-assistant', {
          body: { action: 'insights', content }
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

      // Update streak and show celebration
      toast({
        title: "✨ Entry Saved!",
        description: "Keep up the great journaling habit!",
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
          <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 italic">{promptText}</p>
          </div>
        )}

        {!aiResponse ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="What's on your mind today?"
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
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Save & Get AI Insights
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <p className="text-foreground/80 text-sm whitespace-pre-wrap">{content}</p>
            </div>

            {mood && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Detected mood:</span>
                <Badge className="bg-accent/20 text-accent border-accent/30 capitalize">
                  {mood}
                </Badge>
              </div>
            )}

            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-start gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">AI Insights</h4>
                  <p className="text-foreground/90 text-sm leading-relaxed">{aiResponse}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleNewEntry}
              className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 h-12 text-base"
            >
              Write Another Entry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiaryEntry;
