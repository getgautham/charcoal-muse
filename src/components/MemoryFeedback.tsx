import { useEffect, useState } from "react";

interface MemoryFeedbackProps {
  memoryCount: number;
  show: boolean;
}

export const MemoryFeedback = ({ memoryCount, show }: MemoryFeedbackProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="card-brutal bg-card p-3 min-w-[200px] text-center">
        <div className="text-2xl mb-1">✓</div>
        <p className="text-xs font-bold text-foreground">Memory captured</p>
        <p className="text-[10px] text-muted-foreground">
          #{memoryCount} this year
        </p>
      </div>
    </div>
  );
};
