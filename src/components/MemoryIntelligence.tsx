import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, MapPin, TrendingUp, GitBranch } from "react-feather";
import { Entry } from "@/hooks/useEntries";
import { 
  extractEntities, 
  analyzeEmotionalPatterns, 
  findThemeConnections,
  generatePersonalInsights 
} from "@/utils/nlpAnalysis";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";

interface MemoryIntelligenceProps {
  entries: Entry[];
}

export const MemoryIntelligence = ({ entries }: MemoryIntelligenceProps) => {
  const { entities, emotions, connections, insights } = useMemo(() => {
    if (entries.length === 0) return { entities: [], emotions: [], connections: [], insights: [] };

    const entityMap = extractEntities(entries);
    const sortedEntities = Array.from(entityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      entities: sortedEntities,
      emotions: analyzeEmotionalPatterns(entries),
      connections: findThemeConnections(entries),
      insights: generatePersonalInsights(entries)
    };
  }, [entries]);

  const emotionalJourneyData = useMemo(() => {
    return emotions.slice(0, 20).reverse().map((e, i) => ({
      index: i,
      intensity: e.intensity,
      emotion: e.emotion,
      date: new Date(e.date).toLocaleDateString()
    }));
  }, [emotions]);

  if (entries.length < 3) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Memory Intelligence</h3>
        <p className="text-muted-foreground">
          Write at least 3 entries to unlock deep pattern analysis and discover connections in your thoughts
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Memory Intelligence</h2>
        <Badge variant="secondary" className="ml-auto">Beta</Badge>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">
            <TrendingUp className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="entities">
            <Users className="w-4 h-4 mr-2" />
            Entities
          </TabsTrigger>
          <TabsTrigger value="journey">
            <MapPin className="w-4 h-4 mr-2" />
            Journey
          </TabsTrigger>
          <TabsTrigger value="connections">
            <GitBranch className="w-4 h-4 mr-2" />
            Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4 mt-4">
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="p-4 rounded-lg bg-accent/50 border border-border">
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="entities" className="mt-4">
          <div className="space-y-4">
            {['person', 'place', 'topic'].map(type => {
              const typeEntities = entities.filter(e => e.type === type);
              if (typeEntities.length === 0) return null;

              return (
                <div key={type}>
                  <h3 className="text-sm font-medium mb-2 capitalize">{type}s</h3>
                  <div className="flex flex-wrap gap-2">
                    {typeEntities.map((entity, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {entity.text} <span className="ml-1 text-muted-foreground">×{entity.count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="journey" className="mt-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emotionalJourneyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Your emotional intensity over time
          </p>
        </TabsContent>

        <TabsContent value="connections" className="mt-4">
          <div className="space-y-2">
            {connections.slice(0, 10).map((conn, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 transition-colors">
                <Badge variant="outline" className="text-xs">{conn.source}</Badge>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{conn.strength}</span>
                <div className="flex-1 h-px bg-border" />
                <Badge variant="outline" className="text-xs">{conn.target}</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Topics that frequently appear together in your writing
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
