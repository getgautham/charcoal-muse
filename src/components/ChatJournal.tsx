import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useEntries } from "@/hooks/useEntries";
import { Send } from "react-feather";
import { EMOTION_COLORS, EmotionKey } from "@/utils/emotionColors";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'prompt';
  content: string;
  mood?: string;
  highlights?: Array<{ text: string; emotion: string }>;
  timestamp: string;
}

interface ChatJournalProps {
  onEntryCreated: () => void;
}

export const ChatJournal = ({ onEntryCreated }: ChatJournalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const preferences = useUserPreferences();
  const { entries } = useEntries();

  useEffect(() => {
    loadDailyPrompt();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for preset selection
  useEffect(() => {
    const handlePresetSelect = (e: any) => {
      setPromptText(e.detail);
    };
    window.addEventListener('selectPreset', handlePresetSelect);
    return () => window.removeEventListener('selectPreset', handlePresetSelect);
  }, []);

  // Listen for dice roll from parent
  useEffect(() => {
    const handleDiceRoll = () => {
      loadDailyPrompt();
    };
    window.addEventListener('diceRoll', handleDiceRoll);
    return () => window.removeEventListener('diceRoll', handleDiceRoll);
  }, []);

  const loadDailyPrompt = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-diary-assistant', {
        body: { action: 'prompt', preferences }
      });
      if (error) throw error;
      setPromptText(data.result);
    } catch (error) {
      console.error('Error loading prompt:', error);
    }
  };

  const highlightEmotions = (text: string, mood: string): Array<{ text: string; emotion: string }> => {
    // Simple word-based emotion detection for highlighting
    const emotionKeywords = {
      happiness: ['happy', 'joy', 'great', 'amazing', 'wonderful', 'love', 'blessed', 'grateful'],
      sadness: ['sad', 'down', 'hurt', 'disappointed', 'miss', 'lost'],
      fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'uncertain'],
      anger: ['angry', 'mad', 'frustrated', 'annoyed', 'irritated'],
      surprise: ['surprised', 'shocked', 'unexpected', 'wow', 'amazing'],
      disgust: ['disgusted', 'gross', 'awful', 'terrible', 'horrible']
    };

    const words = text.split(/(\s+)/);
    const highlights: Array<{ text: string; emotion: string }> = [];
    
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, '');
      let foundEmotion = mood;
      
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        if (keywords.some(kw => cleanWord.includes(kw))) {
          foundEmotion = emotion;
          break;
        }
      }
      
      highlights.push({ text: word, emotion: foundEmotion });
    });

    return highlights;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const recentEntries = entries.slice(0, 5).map(e => ({
        mood: e.mood,
        created_at: e.created_at
      }));

      // Get mood and insights
      const [moodResponse, insightsResponse] = await Promise.all([
        supabase.functions.invoke('ai-diary-assistant', {
          body: { action: 'mood', content: currentInput }
        }),
        supabase.functions.invoke('ai-diary-assistant', {
          body: { 
            action: 'insights', 
            content: currentInput,
            preferences,
            recentEntries 
          }
        })
      ]);

      if (moodResponse.error) throw moodResponse.error;
      if (insightsResponse.error) throw insightsResponse.error;

      const detectedMood = moodResponse.data.result.trim().toLowerCase();
      const insights = insightsResponse.data.result;

      // Add AI response with highlighted user message
      const highlights = highlightEmotions(currentInput, detectedMood);
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, mood: detectedMood, highlights }
          : msg
      ));

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: insights,
        mood: detectedMood,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save to database
      await supabase.from('diary_entries').insert({
        user_id: user.id,
        title: null,
        content: currentInput,
        mood: detectedMood,
        ai_insights: insights,
      });

      onEntryCreated();
      loadDailyPrompt(); // Get new prompt

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              {message.highlights ? (
                <p className="text-sm leading-relaxed">
                  {message.highlights.map((part, i) => {
                    const emotionColor = EMOTION_COLORS[part.emotion as EmotionKey];
                    return (
                      <span
                        key={i}
                        style={{
                          color: emotionColor?.text || 'inherit',
                          backgroundColor: emotionColor?.bg || 'transparent',
                          padding: emotionColor ? '0.125rem 0.25rem' : '0',
                          borderRadius: '0.25rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {part.text}
                      </span>
                    );
                  })}
                </p>
              ) : (
                <p className="text-sm leading-relaxed">{message.content}</p>
              )}
              {message.mood && message.type === 'ai' && (
                <div className="mt-2 flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: EMOTION_COLORS[message.mood as EmotionKey]?.text }}
                  />
                  <span className="text-xs opacity-75 capitalize">
                    {EMOTION_COLORS[message.mood as EmotionKey]?.label || message.mood}
                  </span>
                </div>
              )}
              <p className="text-[10px] opacity-50 mt-1">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-3 pb-safe">
        <div className="max-w-md mx-auto">
          {/* Prompt Above Input */}
          {promptText && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-foreground/70 italic">{promptText}</p>
            </div>
          )}

          {/* Input Bar */}
          <div className="flex gap-2 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="What's on your mind?"
              className="flex-1 bg-input border-border/50 text-sm h-10 rounded-full"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
