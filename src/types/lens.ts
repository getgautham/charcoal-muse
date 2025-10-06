export type LensType = 'love' | 'energy' | 'work' | 'growth' | 'satisfaction';

export interface LensScores {
  love: number;
  energy: number;
  work: number;
  growth: number;
  satisfaction: number;
}

export interface LensInsight {
  lens: LensType;
  signal: string;
  interpretation: string;
  reflection_prompt?: string;
}

export const LENSES = [
  { id: 'love' as const, color: '#F17A7E', label: 'Love', essence: 'Connection, belonging, warmth' },
  { id: 'energy' as const, color: '#F6B74C', label: 'Energy', essence: 'Vitality, rhythm, drive' },
  { id: 'work' as const, color: '#F47C32', label: 'Work', essence: 'Purpose, creation, mastery' },
  { id: 'growth' as const, color: '#7057D8', label: 'Growth', essence: 'Evolution, learning, awareness' },
  { id: 'satisfaction' as const, color: '#6EB5D3', label: 'Satisfaction', essence: 'Harmony, balance, contentment' },
];

export const LENS_CONFIG = {
  love: {
    name: 'Love',
    essence: 'Connection, belonging, emotional warmth',
    measures: 'Mentions of people, affection, empathy, care, conflict resolution',
    color: '#F17A7E',
    bg: 'rgba(241, 122, 126, 0.15)',
  },
  energy: {
    name: 'Energy',
    essence: 'Vitality, rhythm, drive',
    measures: 'Words about rest, pace, momentum, tension, movement',
    color: '#F6B74C',
    bg: 'rgba(246, 183, 76, 0.15)',
  },
  work: {
    name: 'Work',
    essence: 'Purpose, creation, mastery',
    measures: 'Verbs of building, striving, finishing, frustration, focus',
    color: '#F47C32',
    bg: 'rgba(244, 124, 50, 0.15)',
  },
  growth: {
    name: 'Growth',
    essence: 'Evolution, learning, self-awareness',
    measures: 'Reflection language ("realized," "learned," "changed"), new topics',
    color: '#7057D8',
    bg: 'rgba(112, 87, 216, 0.15)',
  },
  satisfaction: {
    name: 'Satisfaction',
    essence: 'Harmony, balance, contentment',
    measures: 'Sentiment and tone, calm language, closure phrases',
    color: '#6EB5D3',
    bg: 'rgba(110, 181, 211, 0.15)',
  },
} as const;
