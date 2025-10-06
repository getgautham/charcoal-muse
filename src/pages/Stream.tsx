import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { Memory, LensScores } from "@/hooks/useEntries";
import { LENSES } from "@/types/lens";
import { Loader2 } from "lucide-react";

interface StreamData {
  date: string;
  [key: string]: number | string;
}

export const Stream = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoryCount, setMemoryCount] = useState(0);
  const [weeklySummary, setWeeklySummary] = useState<string>("");

  useEffect(() => {
    loadStreamData();
    
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
      }
    };
  }, []);

  const loadStreamData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMemoryCount(data?.length || 0);

      if (data && data.length >= 3) {
        const memories = data.map(m => ({
          ...m,
          lens_scores: (m.lens_scores || {}) as any as LensScores
        })) as Memory[];
        const streamData = processMemoriesForChart(memories);
        createChart(streamData);
        generateWeeklySummary(memories);
      }
    } catch (error) {
      console.error('Error loading stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMemoriesForChart = (memories: Memory[]): StreamData[] => {
    const dataByDate: Record<string, LensScores> = {};

    memories.forEach((memory) => {
      const date = new Date(memory.created_at).toISOString().split('T')[0];
      if (!dataByDate[date]) {
        dataByDate[date] = { love: 0, energy: 0, work: 0, growth: 0, satisfaction: 0 };
      }
      
      const scores = memory.lens_scores;
      LENSES.forEach(lens => {
        const score = (scores as any)[lens.id] || 0;
        dataByDate[date][lens.id] = Math.max(dataByDate[date][lens.id], score);
      });
    });

    return Object.entries(dataByDate).map(([date, scores]) => ({
      date,
      ...scores
    }));
  };

  const generateWeeklySummary = (memories: Memory[]) => {
    if (memories.length === 0) return;

    const recent = memories.slice(-7);
    const avgScores = LENSES.reduce((acc, lens) => {
      const scores = recent.map(m => (m.lens_scores as any)[lens.id] || 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      acc[lens.id] = avg;
      return acc;
    }, {} as Record<string, number>);

    const trends = LENSES.map(lens => {
      const score = avgScores[lens.id];
      let state = 'steady';
      if (score > 0.6) state = 'rising';
      else if (score < 0.4) state = 'soft';
      return `${lens.label} ${state}`;
    });

    setWeeklySummary(trends.join(' • '));
  };

  const createChart = (data: StreamData[]) => {
    if (!chartRef.current) return;

    if (rootRef.current) {
      rootRef.current.dispose();
    }

    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        paddingTop: 20,
        paddingBottom: 20
      })
    );

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "day", count: 1 },
        renderer: am5xy.AxisRendererX.new(root, { 
          visible: false,
          minGridDistance: 50
        })
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        max: 1,
        strictMinMax: true,
        renderer: am5xy.AxisRendererY.new(root, { visible: false })
      })
    );

    LENSES.forEach((lens) => {
      const series = chart.series.push(
        am5xy.SmoothedXLineSeries.new(root, {
          name: lens.label,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: lens.id,
          valueXField: "date",
          stroke: am5.color(lens.color),
          tension: 0.8,
          tooltip: am5.Tooltip.new(root, {
            labelText: `${lens.label}: {valueY.formatNumber('#.0%')}`,
            getFillFromSprite: false
          })
        })
      );

      series.strokes.template.setAll({
        strokeWidth: 2.5,
        strokeOpacity: 0.85
      });

      const processedData = data.map(d => ({
        date: new Date(d.date).getTime(),
        [lens.id]: d[lens.id] || 0
      }));

      series.data.setAll(processedData);
      series.appear(1000);
    });

    chart.appear(1000, 100);
  };

  const getEmptyStateMessage = () => {
    if (memoryCount === 0) return {
      title: "Your story hasn't started flowing yet",
      subtitle: "Write your first memory to begin your Stream"
    };
    if (memoryCount === 1) return {
      title: "One memory captured",
      subtitle: "Add a few more to see patterns emerge"
    };
    if (memoryCount === 2) return {
      title: "Your Stream is forming",
      subtitle: "Keep adding memories — the flow is beginning"
    };
    return {
      title: "Almost there",
      subtitle: "A few more memories and your Stream will come alive"
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading stream...</p>
      </div>
    );
  }

  const emptyState = getEmptyStateMessage();
  const hasEnoughData = memoryCount >= 3;

  return (
    <div className="h-full overflow-y-auto px-6 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Stream</h1>
        <p className="text-sm text-muted-foreground">
          Every line is a force within you. Watch them find balance.
        </p>
      </div>

      {weeklySummary && (
        <div className="card-brutal p-4 mb-6 bg-muted/30">
          <p className="text-sm text-foreground">💬 {weeklySummary}</p>
        </div>
      )}

      {!hasEnoughData ? (
        <div className="relative w-full h-[50vh] rounded-lg overflow-hidden mb-8">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
          
          {/* Orbiting Lens Dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-48 h-48">
              {LENSES.map((lens, index) => (
                <div
                  key={lens.id}
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: lens.color,
                    opacity: 0.3,
                    top: '50%',
                    left: '50%',
                    animation: `orbit 8s linear infinite`,
                    animationDelay: `${index * 1.6}s`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Empty State Message */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
            <div className="text-center space-y-2 max-w-sm px-6">
              <p className="text-lg font-semibold text-foreground">{emptyState.title}</p>
              <p className="text-sm text-muted-foreground/60">{emptyState.subtitle}</p>
            </div>
            
            {/* Lens Color Swatches */}
            <div className="flex gap-2 mt-4">
              {LENSES.map((lens) => (
                <div
                  key={lens.id}
                  className="w-3 h-3 rounded-full opacity-40"
                  style={{ backgroundColor: lens.color }}
                  title={lens.label}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div ref={chartRef} className="w-full h-[50vh] rounded-lg bg-card/30 p-2 mb-8" />
      )}

      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground mb-3">Legend</h3>
        {LENSES.map((lens) => (
          <div key={lens.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: lens.color }}
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{lens.label}</span>
              <span className="text-xs text-muted-foreground block">{lens.essence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
