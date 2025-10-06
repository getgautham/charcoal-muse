import { LENS_CONFIG, LensType } from "@/types/lens";

interface MirrorInsightProps {
  lensInsights: Record<string, any>;
  timestamp: string;
}

export const MirrorInsight = ({ lensInsights }: MirrorInsightProps) => {
  const primaryLens = Object.entries(lensInsights).find(
    ([_, data]) => data?.detected === true || data?.signal
  );

  if (!primaryLens) return null;

  const [lensKey, lensData] = primaryLens;
  const config = LENS_CONFIG[lensKey as LensType];
  const signal = lensData?.signal || lensData;

  if (!signal || typeof signal !== 'string') return null;

  return (
    <div 
      className="card-brutal p-4 animate-in fade-in-50 slide-in-from-bottom-4"
      style={{ borderColor: config.color }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {config.name}
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        {signal}
      </p>
    </div>
  );
};
