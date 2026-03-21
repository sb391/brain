export const Colors = {
  bg: '#0B1120',
  bgCard: '#141E30',
  bgCardLight: '#1A2740',
  teal: '#00E5CC',
  tealDim: '#00B8A3',
  tealGlow: 'rgba(0, 229, 204, 0.15)',
  amber: '#FFB547',
  amberDim: '#E09A2D',
  amberGlow: 'rgba(255, 181, 71, 0.15)',
  red: '#FF5A5A',
  redGlow: 'rgba(255, 90, 90, 0.15)',
  green: '#4ADE80',
  greenGlow: 'rgba(74, 222, 128, 0.15)',
  white: '#F0F4F8',
  textPrimary: '#F0F4F8',
  textSecondary: '#8899AA',
  textMuted: '#556677',
  border: '#1E2D42',
  overlay: 'rgba(11, 17, 32, 0.85)',
};

export const Tiers = {
  Rookie: { color: '#8899AA', bg: 'rgba(136, 153, 170, 0.12)' },
  Starter: { color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.12)' },
  Sharp: { color: '#00E5CC', bg: 'rgba(0, 229, 204, 0.12)' },
  Elite: { color: '#FFB547', bg: 'rgba(255, 181, 71, 0.12)' },
  Genius: { color: '#E0E7FF', bg: 'rgba(224, 231, 255, 0.15)' },
} as const;

export type TierName = keyof typeof Tiers;

export function getTier(score: number): TierName {
  if (score >= 850) return 'Genius';
  if (score >= 650) return 'Elite';
  if (score >= 450) return 'Sharp';
  if (score >= 250) return 'Starter';
  return 'Rookie';
}
