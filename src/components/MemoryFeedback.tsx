import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface MemoryFeedbackProps {
  memoryCount: number;
  mood?: string;
  patternInsight?: string;
  show: boolean;
}

export const MemoryFeedback = ({ memoryCount, mood, patternInsight, show }: MemoryFeedbackProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="card-brutal bg-card p-4 min-w-[280px]">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-foreground" />
          <span className="font-bold text-foreground">Memory captured</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Memory #{memoryCount} this year
        </p>
        {mood && (
          <p className="text-xs text-foreground mt-1">
            Pattern detected: <span className="font-medium capitalize">{mood}</span>
          </p>
        )}
      </div>
    </div>
  );
};
