import { LensType, LENS_CONFIG } from "@/types/lens";

interface LensFilterProps {
  activeLens: LensType | 'all';
  onLensChange: (lens: LensType | 'all') => void;
}

export const LensFilter = ({ activeLens, onLensChange }: LensFilterProps) => {
  const lenses: Array<LensType | 'all'> = ['all', 'love', 'energy', 'work', 'growth', 'satisfaction'];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1">
      {lenses.map((lens) => {
        const isActive = activeLens === lens;
        const config = lens === 'all' ? null : LENS_CONFIG[lens];
        
        return (
          <button
            key={lens}
            onClick={() => onLensChange(lens)}
            className="card-brutal px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all"
            style={{
              backgroundColor: isActive 
                ? (config?.bg || 'hsl(var(--primary)/0.2)')
                : 'hsl(var(--muted))',
              color: isActive
                ? (config?.color || 'hsl(var(--primary))')
                : 'hsl(var(--muted-foreground))',
              borderColor: isActive
                ? (config?.color || 'hsl(var(--primary))')
                : 'hsl(var(--border))',
            }}
          >
            {lens === 'all' ? 'All' : config?.name}
          </button>
        );
      })}
    </div>
  );
};
