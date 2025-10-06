import { useState } from "react";
import { MessageCircle, TrendingUp, RefreshCw, Star, Target } from "react-feather";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface TopNavProps {
  activeTab: 'chat' | 'story' | 'goals';
  onTabChange: (tab: 'chat' | 'story' | 'goals') => void;
  onDiceClick: () => void;
  onPresetsClick: () => void;
}

const PRESET_PROMPTS = [
  "What made you smile today?",
  "What's challenging you right now?",
  "What are you grateful for?",
  "What's on your mind?",
  "What did you learn today?",
  "How are you feeling about the future?",
  "What's draining your energy?",
  "What brought you peace today?"
];

export const TopNav = ({ activeTab, onTabChange, onDiceClick, onPresetsClick }: TopNavProps) => {
  const [presetsOpen, setPresetsOpen] = useState(false);

  const handlePresetSelect = (prompt: string) => {
    // Trigger the prompt selection
    const event = new CustomEvent('selectPreset', { detail: prompt });
    window.dispatchEvent(event);
    setPresetsOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border pb-safe">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Presets Button */}
          <Sheet open={presetsOpen} onOpenChange={setPresetsOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 btn-brutal bg-primary hover:bg-primary/90"
              >
                <Star className="w-4 h-4 text-primary-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Quick Prompts</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {PRESET_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handlePresetSelect(prompt)}
                    className="w-full text-left p-3 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Center: Tabs */}
          <div className="flex-1 flex justify-center">
            <div className="inline-flex card-brutal bg-muted p-1 rounded-md">
              <button
                onClick={() => onTabChange('chat')}
                className={`px-6 py-1.5 rounded text-sm font-bold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-1.5" />
                Chat
              </button>
              <button
                onClick={() => onTabChange('goals')}
                className={`px-6 py-1.5 rounded text-sm font-bold transition-all ${
                  activeTab === 'goals'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Target className="w-4 h-4 inline mr-1.5" />
                Goals
              </button>
              <button
                onClick={() => onTabChange('story')}
                className={`px-6 py-1.5 rounded text-sm font-bold transition-all ${
                  activeTab === 'story'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-1.5" />
                Pulse
              </button>
            </div>
          </div>

          {/* Right: Dice Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onDiceClick}
            className="h-8 w-8 btn-brutal bg-accent hover:bg-accent/90"
          >
            <RefreshCw className="w-4 h-4 text-accent-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};
