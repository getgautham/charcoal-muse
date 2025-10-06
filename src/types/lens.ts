export type LensType = 'love' | 'energy' | 'work' | 'growth' | 'satisfaction';

export interface LensSignal {
  detected: boolean;
  signal: string;
}

export interface LensInsights {
  love?: LensSignal;
  energy?: LensSignal;
  work?: LensSignal;
  growth?: LensSignal;
  satisfaction?: LensSignal;
}

export const LENS_CONFIG = {
  love: {
    name: 'Love',
    essence: 'Connection, belonging, emotional warmth',
    measures: 'Mentions of people, affection, empathy, care, conflict resolution',
    color: 'hsl(340, 75%, 65%)', // Warm rose
    bg: 'hsl(340, 75%, 65%, 0.15)',
  },
  energy: {
    name: 'Energy',
    essence: 'Vitality, rhythm, drive',
    measures: 'Words about rest, pace, momentum, tension, movement',
    color: 'hsl(45, 90%, 60%)', // Golden amber
    bg: 'hsl(45, 90%, 60%, 0.15)',
  },
  work: {
    name: 'Work',
    essence: 'Purpose, creation, mastery',
    measures: 'Verbs of building, striving, finishing, frustration, focus',
    color: 'hsl(25, 75%, 55%)', // Burnt orange
    bg: 'hsl(25, 75%, 55%, 0.15)',
  },
  growth: {
    name: 'Growth',
    essence: 'Evolution, learning, self-awareness',
    measures: 'Reflection language ("realized," "learned," "changed"), new topics',
    color: 'hsl(240, 60%, 55%)', // Indigo
    bg: 'hsl(240, 60%, 55%, 0.15)',
  },
  satisfaction: {
    name: 'Satisfaction',
    essence: 'Harmony, balance, contentment',
    measures: 'Sentiment and tone, calm language, closure phrases',
    color: 'hsl(210, 70%, 65%)', // Soft blue
    bg: 'hsl(210, 70%, 65%, 0.15)',
  },
} as const;
