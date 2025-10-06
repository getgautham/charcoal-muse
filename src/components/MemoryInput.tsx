import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MemoryInputProps {
  onSubmit: (content: string) => void;
  loading: boolean;
  promptText: string;
  timeSinceLastLogin: string;
}

export const MemoryInput = ({ onSubmit, loading, promptText, timeSinceLastLogin }: MemoryInputProps) => {
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const words = input.trim().split(/\s+/).length;
    if (words < 5) return;
    onSubmit(input.trim());
    setInput("");
    setShowInput(false);
  };

  const wordCount = input.trim().split(/\s+/).filter(w => w).length;
  const isValid = wordCount >= 5;

  return (
    <div className="bg-card border-2 border-border shadow-[4px_4px_0px_hsl(var(--border))] rounded-md p-4">
      {/* Prompt */}
      <div className="mb-4">
        <p className="text-sm font-bold text-foreground">
          What's one memory from {timeSinceLastLogin}?
        </p>
        {promptText && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            {promptText}
          </p>
        )}
      </div>

      {!showInput ? (
        <Button
          onClick={() => setShowInput(true)}
          className="w-full btn-brutal bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          size="lg"
        >
          Share a memory
        </Button>
      ) : (
        <div className="space-y-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && isValid) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="I remember..."
            className="input-brutal bg-input text-foreground placeholder:text-muted-foreground text-sm min-h-[100px] max-h-[300px] resize-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isValid ? 'text-foreground' : 'text-muted-foreground'}`}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'} {!isValid && '(min 5)'}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="btn-brutal bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
