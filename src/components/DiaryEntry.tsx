import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Save, Lightbulb } from "lucide-react";

interface DiaryEntryProps {
  onEntryCreated: () => void;
}

const DiaryEntry = ({ onEntryCreated }: DiaryEntryProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const getPrompt = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ai-diary-assistant', {
        body: { action: 'prompt' }
      });

      if (error) throw error;
      toast({
        title: "✨ Writing Prompt",
        description: data.result,
        duration: 8000,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get writing prompt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeEntry = async () => {
    if (!content.trim()) {
      toast({
        title: "Write something first",
        description: "Add some content to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      setAnalyzing(true);

      const [moodResponse, insightsResponse] = await Promise.all([
        supabase.functions.invoke('ai-diary-assistant', {
          body: { action: 'mood', content }
        }),
        supabase.functions.invoke('ai-diary-assistant', {
          body: { action: 'insights', content, mood }
        })
      ]);

      if (moodResponse.error) throw moodResponse.error;
      if (insightsResponse.error) throw insightsResponse.error;

      setMood(moodResponse.data.result.trim().toLowerCase());
      setInsights(insightsResponse.data.result);

      toast({
        title: "Analysis Complete",
        description: "AI insights generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze entry",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveEntry = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('diary_entries').insert({
        user_id: user.id,
        title: title.trim() || null,
        content: content.trim(),
        mood: mood || null,
        ai_insights: insights || null,
      });

      if (error) throw error;

      toast({
        title: "Entry Saved",
        description: "Your thoughts have been recorded",
      });

      setTitle("");
      setContent("");
      setMood("");
      setInsights("");
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

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-foreground">New Entry</CardTitle>
          <Button
            onClick={getPrompt}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-accent/50 text-accent hover:bg-accent/10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Lightbulb className="mr-2 h-4 w-4" />
                Prompt
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-border/50 bg-background/50"
        />
        <Textarea
          placeholder="What's on your mind today?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="border-border/50 bg-background/50 resize-none"
        />
        
        {mood && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mood:</span>
            <Badge className="bg-accent/20 text-accent border-accent/30">{mood}</Badge>
          </div>
        )}
        
        {insights && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground/90 italic">{insights}</p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={analyzeEntry}
            disabled={analyzing || !content.trim()}
            variant="outline"
            className="flex-1 border-primary/50 text-primary hover:bg-primary/10"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI Analyze
              </>
            )}
          </Button>
          <Button
            onClick={saveEntry}
            disabled={loading || !content.trim()}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiaryEntry;
