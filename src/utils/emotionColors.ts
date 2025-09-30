// AA-compliant emotion colors on dark background
export const EMOTION_COLORS = {
  happiness: {
    text: 'hsl(48, 100%, 70%)', // Bright yellow - AA on dark
    bg: 'hsl(48, 100%, 70%, 0.15)',
    label: 'Happiness'
  },
  sadness: {
    text: 'hsl(221, 90%, 75%)', // Light blue - AA on dark
    bg: 'hsl(221, 90%, 75%, 0.15)',
    label: 'Sadness'
  },
  fear: {
    text: 'hsl(280, 70%, 75%)', // Light purple - AA on dark
    bg: 'hsl(280, 70%, 75%, 0.15)',
    label: 'Fear'
  },
  anger: {
    text: 'hsl(0, 85%, 75%)', // Light red - AA on dark
    bg: 'hsl(0, 85%, 75%, 0.15)',
    label: 'Anger'
  },
  surprise: {
    text: 'hsl(168, 85%, 70%)', // Light teal - AA on dark
    bg: 'hsl(168, 85%, 70%, 0.15)',
    label: 'Surprise'
  },
  disgust: {
    text: 'hsl(88, 60%, 70%)', // Light olive - AA on dark
    bg: 'hsl(88, 60%, 70%, 0.15)',
    label: 'Disgust'
  },
  // Extended emotions mapped
  grateful: { text: 'hsl(48, 100%, 70%)', bg: 'hsl(48, 100%, 70%, 0.15)', label: 'Happiness' },
  happy: { text: 'hsl(48, 100%, 70%)', bg: 'hsl(48, 100%, 70%, 0.15)', label: 'Happiness' },
  sad: { text: 'hsl(221, 90%, 75%)', bg: 'hsl(221, 90%, 75%, 0.15)', label: 'Sadness' },
  anxious: { text: 'hsl(280, 70%, 75%)', bg: 'hsl(280, 70%, 75%, 0.15)', label: 'Fear' },
  frustrated: { text: 'hsl(0, 85%, 75%)', bg: 'hsl(0, 85%, 75%, 0.15)', label: 'Anger' },
  excited: { text: 'hsl(168, 85%, 70%)', bg: 'hsl(168, 85%, 70%, 0.15)', label: 'Surprise' },
} as const;

export type EmotionKey = keyof typeof EMOTION_COLORS;
