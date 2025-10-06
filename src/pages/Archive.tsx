import { useEntries, Memory } from "@/hooks/useEntries";
import { LENS_CONFIG } from "@/types/lens";
import { format } from "date-fns";
import { useState } from "react";

export const Archive = () => {
  const { entries, loading } = useEntries();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const groupedByDate = entries.reduce((acc, memory) => {
    const date = format(new Date(memory.created_at), 'MMMM yyyy');
    if (!acc[date]) acc[date] = [];
    acc[date].push(memory);
    return acc;
  }, {} as Record<string, Memory[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading archive...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No memories yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Archive</h1>

      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, memories]) => (
          <div key={date}>
            <h2 className="text-sm font-bold text-muted-foreground mb-3">{date}</h2>
            <div className="space-y-3">
              {memories.map((memory) => {
                const dominantLens = memory.dominant_lens || 'satisfaction';
                const lensConfig = LENS_CONFIG[dominantLens as keyof typeof LENS_CONFIG];
                const isExpanded = expandedId === memory.id;

                return (
                  <div
                    key={memory.id}
                    className="card-brutal p-4 cursor-pointer transition-all"
                    onClick={() => setExpandedId(isExpanded ? null : memory.id)}
                    style={{ borderColor: isExpanded ? lensConfig.color : undefined }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: lensConfig.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">
                          {memory.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(memory.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>

                    {isExpanded && memory.lens_scores && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(memory.lens_scores)
                            .filter(([_, score]) => typeof score === 'number' && score > 0.3)
                            .map(([lens, score]) => {
                              const config = LENS_CONFIG[lens as keyof typeof LENS_CONFIG];
                              const scoreNum = typeof score === 'number' ? score : 0;
                              return (
                                <div
                                  key={lens}
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: config.bg,
                                    color: config.color
                                  }}
                                >
                                  {config.name} {Math.round(scoreNum * 100)}%
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
