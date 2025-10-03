import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useEntries } from "@/hooks/useEntries";
import { useSubscription } from "@/hooks/useSubscription";
import { Send } from "react-feather";
import { Crown } from "lucide-react"; // Premium icon
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const preferences = useUserPreferences();
  const { entries } = useEntries();
  const { subscribed, prompts_remaining, openCheckout, refresh } = useSubscription();

  // Load persisted messages
  useEffect(() => {
    loadMessages();
    loadDailyPrompt();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(data.map(msg => ({
          id: msg.id,
          type: msg.type as 'user' | 'ai' | 'prompt',
          content: msg.content,
          mood: msg.mood || undefined,
          highlights: msg.highlights as Array<{ text: string; emotion: string }> || undefined,
          timestamp: msg.timestamp
        })));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

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

    // Check usage limits for free users
    if (!subscribed && prompts_remaining !== undefined && prompts_remaining <= 0) {
      toast({
        title: "Free limit reached",
        description: "You've used all 30 free prompts. Upgrade to Premium for unlimited journaling!",
        variant: "destructive",
      });
      return;
    }

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

      // Save messages to chat_messages table
      await Promise.all([
        supabase.from('chat_messages').insert({
          user_id: user.id,
          type: 'user',
          content: currentInput,
          mood: detectedMood,
          highlights: highlights,
          timestamp: userMessage.timestamp
        }),
        supabase.from('chat_messages').insert({
          user_id: user.id,
          type: 'ai',
          content: insights,
          mood: detectedMood,
          timestamp: aiMessage.timestamp
        }),
        // Save to diary_entries for history
        supabase.from('diary_entries').insert({
          user_id: user.id,
          title: null,
          content: currentInput,
          mood: detectedMood,
          ai_insights: insights,
        })
      ]);

      // Increment usage for free users
      if (!subscribed) {
        await supabase.rpc('increment_prompt_usage', { p_user_id: user.id });
        if (refresh) refresh(); // Refresh subscription status to update prompts_remaining
      }

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
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-[#333333]'
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

      {/* Fixed Bottom Input Area - Above Bottom Nav */}
      <div className="bg-background border-t border-border px-4 py-3 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Usage Warning for Free Users */}
          {!subscribed && prompts_remaining !== undefined && prompts_remaining <= 5 && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <p className="text-xs text-orange-700 font-medium">
                {prompts_remaining > 0 
                  ? `${prompts_remaining} free prompts remaining`
                  : 'Free prompts exhausted'}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCheckout?.()}
                className="h-6 text-xs gap-1 border-orange-600 text-orange-700 hover:bg-orange-50"
              >
                <Crown className="w-3 h-3" />
                Upgrade
              </Button>
            </div>
          )}

          {/* Prompt Above Input */}
          {promptText && (
            <div className="mb-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-[#333333] italic">{promptText}</p>
            </div>
          )}

          {/* Input Bar */}
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="What's on your mind?"
              className="flex-1 bg-white border-[#d1d1d1] text-[#333333] placeholder:text-[#666666] text-sm min-h-[48px] max-h-[200px] rounded-2xl resize-none py-3"
              disabled={loading}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
