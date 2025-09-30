import nlp from 'compromise';

export interface ExtractedEntity {
  text: string;
  type: 'person' | 'place' | 'organization' | 'date' | 'topic';
  count: number;
  dates: string[];
}

export interface EmotionalPattern {
  emotion: string;
  intensity: number;
  date: string;
  context: string;
}

export interface ThemeConnection {
  source: string;
  target: string;
  strength: number;
}

export const extractEntities = (entries: any[]): Map<string, ExtractedEntity> => {
  const entityMap = new Map<string, ExtractedEntity>();

  entries.forEach(entry => {
    const doc = nlp(entry.content);
    
    // Extract people
    doc.people().out('array').forEach((person: string) => {
      addEntity(entityMap, person, 'person', entry.created_at);
    });

    // Extract places
    doc.places().out('array').forEach((place: string) => {
      addEntity(entityMap, place, 'place', entry.created_at);
    });

    // Extract organizations
    doc.organizations().out('array').forEach((org: string) => {
      addEntity(entityMap, org, 'organization', entry.created_at);
    });

    // Extract topics (nouns that appear frequently)
    doc.nouns().out('array').forEach((noun: string) => {
      if (noun.length > 3) {
        addEntity(entityMap, noun, 'topic', entry.created_at);
      }
    });
  });

  return entityMap;
};

const addEntity = (map: Map<string, ExtractedEntity>, text: string, type: ExtractedEntity['type'], date: string) => {
  const key = text.toLowerCase();
  if (map.has(key)) {
    const entity = map.get(key)!;
    entity.count++;
    entity.dates.push(date);
  } else {
    map.set(key, { text, type, count: 1, dates: [date] });
  }
};

export const analyzeEmotionalPatterns = (entries: any[]): EmotionalPattern[] => {
  const patterns: EmotionalPattern[] = [];

  entries.forEach(entry => {
    if (!entry.mood) return;

    const doc = nlp(entry.content);
    const sentences = doc.sentences().out('array');
    
    // Calculate intensity based on exclamation marks, capitals, and sentence length
    const intensity = calculateIntensity(entry.content);

    patterns.push({
      emotion: entry.mood,
      intensity,
      date: entry.created_at,
      context: sentences[0] || entry.content.substring(0, 100)
    });
  });

  return patterns;
};

const calculateIntensity = (text: string): number => {
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const capitals = (text.match(/[A-Z]/g) || []).length;
  
  return Math.min(10, exclamations * 2 + questions + capitals / 10);
};

export const findThemeConnections = (entries: any[]): ThemeConnection[] => {
  const themes = new Map<string, Set<string>>();
  const connections: ThemeConnection[] = [];

  entries.forEach(entry => {
    const doc = nlp(entry.content);
    const topics = doc.topics().out('array').map((t: string) => t.toLowerCase());
    
    topics.forEach(topic => {
      if (!themes.has(topic)) {
        themes.set(topic, new Set());
      }
      topics.forEach(otherTopic => {
        if (topic !== otherTopic) {
          themes.get(topic)!.add(otherTopic);
        }
      });
    });
  });

  themes.forEach((connected, source) => {
    connected.forEach(target => {
      const strength = Array.from(themes.get(target) || []).filter(t => 
        themes.get(source)?.has(t)
      ).length;
      
      if (strength > 0) {
        connections.push({ source, target, strength });
      }
    });
  });

  return connections.sort((a, b) => b.strength - a.strength).slice(0, 20);
};

export const generatePersonalInsights = (entries: any[]): string[] => {
  const insights: string[] = [];
  const entities = extractEntities(entries);
  const emotions = analyzeEmotionalPatterns(entries);

  // Most mentioned entities
  const topEntities = Array.from(entities.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (topEntities.length > 0) {
    const topEntity = topEntities[0];
    insights.push(`${topEntity.text} appears ${topEntity.count} times in your entries - this seems important to you`);
  }

  // Emotional trends
  const recentEmotions = emotions.slice(0, 5).map(e => e.emotion);
  const uniqueEmotions = new Set(recentEmotions);
  if (uniqueEmotions.size === 1 && recentEmotions.length >= 3) {
    insights.push(`You've been consistently feeling ${recentEmotions[0]} - this pattern is worth noticing`);
  }

  // Writing frequency patterns
  const dates = entries.map(e => new Date(e.created_at).getDay());
  const dayCount = dates.reduce((acc, day) => {
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  const mostActiveDay = Object.entries(dayCount).sort(([,a], [,b]) => b - a)[0];
  if (mostActiveDay) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    insights.push(`You write most often on ${dayNames[parseInt(mostActiveDay[0])]}s`);
  }

  return insights;
};
