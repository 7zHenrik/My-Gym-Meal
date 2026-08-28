/**
 * Design tokens for the app. "Food first": neutral, high-contrast surfaces
 * with a single confident accent color, generous rounded corners, and large
 * image areas. Keep this file as the single source of truth for colors,
 * spacing, radii, and typography so the app looks consistent everywhere.
 */
import '@/global.css';

import { Platform } from 'react-native';

// A warm, energetic accent (protein/gym feel) without going full "gradient
// dashboard". Used sparingly: primary buttons, active tab, like/heart.
const accent = '#FF4D5E';
const accentDark = '#FF6B7A';

export const Colors = {
  light: {
    text: '#12131A',
    textSecondary: '#6B7078',
    textTertiary: '#9AA0A8',
    background: '#FFFFFF',
    backgroundElement: '#F5F5F7',
    backgroundSelected: '#ECEDF0',
    border: '#E7E8EC',
    card: '#FFFFFF',
    accent,
    accentText: '#FFFFFF',
    success: '#2FBF71',
    danger: '#E5484D',
    overlay: 'rgba(18,19,26,0.55)',
  },
  dark: {
    text: '#F6F6F8',
    textSecondary: '#A6ABB4',
    textTertiary: '#6E727B',
    background: '#0B0B0D',
    backgroundElement: '#1A1B1F',
    backgroundSelected: '#25262B',
    border: '#26272C',
    card: '#17181C',
    accent: accentDark,
    accentText: '#12131A',
    success: '#37D67A',
    danger: '#FF6B70',
    overlay: 'rgba(0,0,0,0.65)',
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

export const Radius = {
  small: 8,
  medium: 14,
  large: 20,
  xl: 28,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
