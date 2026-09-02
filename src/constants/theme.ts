import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#F8F9FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: '#0F0F11',
    accent: '#FFD740',
    accentLight: '#FFF8E1',
    border: '#E8ECF2',
    card: '#FFFFFF',
    success: '#22C55E',
    danger: '#EF4444',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0F0F11',
    backgroundElement: '#18191D',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#FFD740',
    accent: '#FFD740',
    accentLight: '#2C2607',
    border: '#272A30',
    card: '#18191D',
    success: '#22C55E',
    danger: '#EF4444',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
