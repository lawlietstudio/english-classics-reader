export type ThemeColors = {
  background: string;
  surface: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentStrong: string;
  inverse: string;
  inverseText: string;
  inverseMuted: string;
  pill: string;
  activeCardBg: string;
  modalOverlay: string;
};

export type PaletteId = 'amber' | 'indigo' | 'jade' | 'rose';

export type Palette = {
  id: PaletteId;
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
};

const amberLight: ThemeColors = {
  background: '#FBF7F0',
  surface: '#FFFFFF',
  surfaceBorder: '#EAE0D2',
  textPrimary: '#2B2118',
  textSecondary: '#8A7A66',
  textMuted: '#5A4E40',
  accent: '#A9673C',
  accentStrong: '#8C3B2E',
  inverse: '#2B2118',
  inverseText: '#FBF7F0',
  inverseMuted: '#C9B79C',
  pill: '#EFE6D6',
  activeCardBg: '#FDF3EF',
  modalOverlay: 'rgba(43,33,24,0.4)',
};

const amberDark: ThemeColors = {
  background: '#181310',
  surface: '#241F18',
  surfaceBorder: '#3A3226',
  textPrimary: '#F1E6D6',
  textSecondary: '#A99A82',
  textMuted: '#C4B49C',
  accent: '#E0935F',
  accentStrong: '#D97B52',
  inverse: '#F1E6D6',
  inverseText: '#181310',
  inverseMuted: '#7A6B54',
  pill: '#2E281F',
  activeCardBg: '#2E211A',
  modalOverlay: 'rgba(0,0,0,0.6)',
};

const indigoLight: ThemeColors = {
  background: '#F5F6FB',
  surface: '#FFFFFF',
  surfaceBorder: '#DEE1F0',
  textPrimary: '#1E2233',
  textSecondary: '#6B7094',
  textMuted: '#454A66',
  accent: '#4C5FD7',
  accentStrong: '#33409E',
  inverse: '#1E2233',
  inverseText: '#F5F6FB',
  inverseMuted: '#A6ABCF',
  pill: '#E4E6F5',
  activeCardBg: '#EFF0FB',
  modalOverlay: 'rgba(30,34,51,0.4)',
};

const indigoDark: ThemeColors = {
  background: '#12141F',
  surface: '#1B1E2E',
  surfaceBorder: '#2E3350',
  textPrimary: '#E7E9F7',
  textSecondary: '#9BA0C7',
  textMuted: '#C1C5E4',
  accent: '#8891F0',
  accentStrong: '#6B76E0',
  inverse: '#E7E9F7',
  inverseText: '#12141F',
  inverseMuted: '#5A5F87',
  pill: '#242840',
  activeCardBg: '#1F2438',
  modalOverlay: 'rgba(0,0,0,0.6)',
};

const jadeLight: ThemeColors = {
  background: '#F3F8F4',
  surface: '#FFFFFF',
  surfaceBorder: '#D9E8DC',
  textPrimary: '#1D2E20',
  textSecondary: '#6C8873',
  textMuted: '#3E5A45',
  accent: '#3F8F5C',
  accentStrong: '#2B6E45',
  inverse: '#1D2E20',
  inverseText: '#F3F8F4',
  inverseMuted: '#A6C4AC',
  pill: '#E1EFE4',
  activeCardBg: '#EDF6EE',
  modalOverlay: 'rgba(29,46,32,0.4)',
};

const jadeDark: ThemeColors = {
  background: '#101913',
  surface: '#18241C',
  surfaceBorder: '#2A3D2F',
  textPrimary: '#E4F1E6',
  textSecondary: '#9FBBA5',
  textMuted: '#BFD8C3',
  accent: '#69C98A',
  accentStrong: '#4FAE72',
  inverse: '#E4F1E6',
  inverseText: '#101913',
  inverseMuted: '#527257',
  pill: '#20301F',
  activeCardBg: '#1C2A20',
  modalOverlay: 'rgba(0,0,0,0.6)',
};

const roseLight: ThemeColors = {
  background: '#FBF3F3',
  surface: '#FFFFFF',
  surfaceBorder: '#F0DADC',
  textPrimary: '#33191D',
  textSecondary: '#937075',
  textMuted: '#5E3A3F',
  accent: '#B84A5A',
  accentStrong: '#8E2E3D',
  inverse: '#33191D',
  inverseText: '#FBF3F3',
  inverseMuted: '#D3ABB0',
  pill: '#F3E0E2',
  activeCardBg: '#FBEEEF',
  modalOverlay: 'rgba(51,25,29,0.4)',
};

const roseDark: ThemeColors = {
  background: '#1A1214',
  surface: '#241A1D',
  surfaceBorder: '#3D2A2E',
  textPrimary: '#F3E2E4',
  textSecondary: '#B8949A',
  textMuted: '#D3B2B7',
  accent: '#E17E8C',
  accentStrong: '#D15F70',
  inverse: '#F3E2E4',
  inverseText: '#1A1214',
  inverseMuted: '#7A575D',
  pill: '#2E2023',
  activeCardBg: '#291C1F',
  modalOverlay: 'rgba(0,0,0,0.6)',
};

export const palettes: Palette[] = [
  { id: 'amber', name: '暖褐', light: amberLight, dark: amberDark },
  { id: 'indigo', name: '靛藍', light: indigoLight, dark: indigoDark },
  { id: 'jade', name: '墨綠', light: jadeLight, dark: jadeDark },
  { id: 'rose', name: '胭脂', light: roseLight, dark: roseDark },
];

export const defaultPaletteId: PaletteId = 'indigo';

export function getPalette(id: PaletteId): Palette {
  return palettes.find((p) => p.id === id) ?? palettes[0];
}

export function isPaletteId(value: string): value is PaletteId {
  return palettes.some((p) => p.id === value);
}
