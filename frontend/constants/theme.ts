/**
 * Theme colors for the Fisherman App
 * Deep teal aquatic palette for a calming, outdoor-ready UI
 */

import { Platform } from 'react-native';

// Primary teal colors
const tintColorLight = '#2C7A7B';  // Deep Teal
const tintColorDark = '#4FD1C5';   // Light teal for dark mode

export const Colors = {
  light: {
    text: '#1A202C',           // Dark slate
    textSecondary: '#718096',  // Cool grey
    background: '#F7F9FC',     // Light grey-blue
    tint: tintColorLight,
    icon: '#718096',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E2E8F0',
    notification: '#E53E3E',
    success: '#38A169',
    warning: '#D69E2E',
    // Gradient colors
    gradientStart: '#319795',
    gradientEnd: '#285E61',
  },
  dark: {
    text: '#F7FAFC',
    textSecondary: '#A0AEC0',
    background: '#1A202C',
    tint: tintColorDark,
    icon: '#A0AEC0',
    tabIconDefault: '#718096',
    tabIconSelected: tintColorDark,
    card: '#2D3748',
    border: '#4A5568',
    notification: '#FC8181',
    success: '#68D391',
    warning: '#F6E05E',
    // Gradient colors
    gradientStart: '#2C7A7B',
    gradientEnd: '#1D5A5B',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS system fonts with rounded design */
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
    sans: "Inter, Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});
