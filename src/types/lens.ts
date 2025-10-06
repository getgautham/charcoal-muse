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
    color: 'hsl(340, 85%, 75%)',
    bg: 'hsl(340, 85%, 75%, 0.15)',
  },
  energy: {
    name: 'Energy',
    essence: 'Vitality, rhythm, drive',
    measures: 'Words about rest, pace, momentum, tension, movement',
    color: 'hsl(45, 100%, 70%)',
    bg: 'hsl(45, 100%, 70%, 0.15)',
  },
  work: {
    name: 'Work',
    essence: 'Purpose, creation, mastery',
    measures: 'Verbs of building, striving, finishing, frustration, focus',
    color: 'hsl(200, 85%, 70%)',
    bg: 'hsl(200, 85%, 70%, 0.15)',
  },
  growth: {
    name: 'Growth',
    essence: 'Evolution, learning, self-awareness',
    measures: 'Reflection language ("realized," "learned," "changed"), new topics',
    color: 'hsl(140, 70%, 65%)',
    bg: 'hsl(140, 70%, 65%, 0.15)',
  },
  satisfaction: {
    name: 'Satisfaction',
    essence: 'Harmony, balance, contentment',
    measures: 'Sentiment and tone, calm language, closure phrases',
    color: 'hsl(260, 70%, 75%)',
    bg: 'hsl(260, 70%, 75%, 0.15)',
  },
} as const;
