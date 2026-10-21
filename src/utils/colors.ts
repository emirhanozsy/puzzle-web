export interface PlayerColor {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  ringClass: string;
}

export const PLAYER_COLORS: PlayerColor[] = [
  {
    id: 'watermelon',
    name: 'Karpuz Kırmızı',
    hex: '#FF385C',
    bgClass: 'bg-[#FF385C]',
    borderClass: 'border-[#FF385C]',
    textClass: 'text-[#FF385C]',
    ringClass: 'ring-[#FF385C]',
  },
  {
    id: 'mint',
    name: 'Taze Nane',
    hex: '#10B981',
    bgClass: 'bg-[#10B981]',
    borderClass: 'border-[#10B981]',
    textClass: 'text-[#10B981]',
    ringClass: 'ring-[#10B981]',
  },
  {
    id: 'mango',
    name: 'Canlı Mango',
    hex: '#F59E0B',
    bgClass: 'bg-[#F59E0B]',
    borderClass: 'border-[#F59E0B]',
    textClass: 'text-[#F59E0B]',
    ringClass: 'ring-[#F59E0B]',
  },
  {
    id: 'electric-violet',
    name: 'Neon Menekşe',
    hex: '#8B5CF6',
    bgClass: 'bg-[#8B5CF6]',
    borderClass: 'border-[#8B5CF6]',
    textClass: 'text-[#8B5CF6]',
    ringClass: 'ring-[#8B5CF6]',
  },
  {
    id: 'cyan-surf',
    name: 'Okyanus Turkuazı',
    hex: '#06B6D4',
    bgClass: 'bg-[#06B6D4]',
    borderClass: 'border-[#06B6D4]',
    textClass: 'text-[#06B6D4]',
    ringClass: 'ring-[#06B6D4]',
  },
  {
    id: 'coral-flame',
    name: 'Canlı Mercan',
    hex: '#FF643D',
    bgClass: 'bg-[#FF643D]',
    borderClass: 'border-[#FF643D]',
    textClass: 'text-[#FF643D]',
    ringClass: 'ring-[#FF643D]',
  },
  {
    id: 'hot-pink',
    name: 'Şeker Pembesi',
    hex: '#EC4899',
    bgClass: 'bg-[#EC4899]',
    borderClass: 'border-[#EC4899]',
    textClass: 'text-[#EC4899]',
    ringClass: 'ring-[#EC4899]',
  },
  {
    id: 'lime-energy',
    name: 'Parlak Limon',
    hex: '#84CC16',
    bgClass: 'bg-[#84CC16]',
    borderClass: 'border-[#84CC16]',
    textClass: 'text-[#84CC16]',
    ringClass: 'ring-[#84CC16]',
  },
  {
    id: 'royal-blue',
    name: 'Elektrik Mavisi',
    hex: '#3B82F6',
    bgClass: 'bg-[#3B82F6]',
    borderClass: 'border-[#3B82F6]',
    textClass: 'text-[#3B82F6]',
    ringClass: 'ring-[#3B82F6]',
  },
  {
    id: 'sunburst-orange',
    name: 'Güneş Turuncusu',
    hex: '#EA580C',
    bgClass: 'bg-[#EA580C]',
    borderClass: 'border-[#EA580C]',
    textClass: 'text-[#EA580C]',
    ringClass: 'ring-[#EA580C]',
  },
];

export function getColorByHex(hex: string): PlayerColor {
  return PLAYER_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase()) || PLAYER_COLORS[0];
}

export function isNicknameTaken(nickname: string, existingNicknames: string[], currentNickname?: string): boolean {
  const clean = nickname.trim().toLowerCase();
  if (!clean) return false;
  return existingNicknames.some(n => n.toLowerCase() === clean && n.toLowerCase() !== currentNickname?.toLowerCase());
}

export function isColorTaken(colorHex: string, existingColors: string[], currentColorHex?: string): boolean {
  const clean = colorHex.toLowerCase();
  return existingColors.some(c => c.toLowerCase() === clean && c.toLowerCase() !== currentColorHex?.toLowerCase());
}
