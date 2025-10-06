import { LensInsights, LENS_CONFIG, LensType } from "@/types/lens";

interface MirrorInsightProps {
  lensInsights?: LensInsights;
  timestamp: string;
}

export const MirrorInsight = ({ lensInsights, timestamp }: MirrorInsightProps) => {
  if (!lensInsights) return null;

  const activeLenses = Object.entries(lensInsights)
    .filter(([_, data]) => data?.detected)
    .map(([lens, data]) => ({ lens: lens as LensType, signal: data.signal }));

  if (activeLenses.length === 0) return null;

  // Show only the primary insight
  const primary = activeLenses[0];
  const config = LENS_CONFIG[primary.lens];

  return (
    <div className="card-brutal bg-muted p-4 rounded-md animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>
          {config.name}
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        {primary.signal}
      </p>
      <p className="text-[10px] text-muted-foreground mt-3">
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
};
