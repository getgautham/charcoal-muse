import { LensInsights } from "@/types/lens";
import { LensInsightDisplay } from "./LensInsightDisplay";

interface MirrorInsightProps {
  lensInsights?: LensInsights;
  timestamp: string;
}

export const MirrorInsight = ({ lensInsights, timestamp }: MirrorInsightProps) => {
  if (!lensInsights) return null;

  return (
    <div className="card-brutal bg-muted p-4 rounded-md">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        🪞 Mirror
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-2">
        The mirror reflects your patterns
      </p>
      <LensInsightDisplay lensInsights={lensInsights} />
      <p className="text-[10px] text-muted-foreground mt-3">
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
};
