import { LensInsights, LENS_CONFIG, LensType } from "@/types/lens";

interface LensInsightDisplayProps {
  lensInsights: LensInsights;
}

export const LensInsightDisplay = ({ lensInsights }: LensInsightDisplayProps) => {
  const activeLenses = Object.entries(lensInsights).filter(
    ([_, data]) => data?.detected
  ) as Array<[LensType, { detected: boolean; signal: string }]>;

  if (activeLenses.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t-2 border-border space-y-2">
      {activeLenses.map(([lens, data]) => {
        const config = LENS_CONFIG[lens];
        return (
          <div
            key={lens}
            className="flex items-start gap-2"
          >
            <div
              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <div>
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: config.color }}
              >
                {config.name}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.signal}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
