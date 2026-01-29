// Design System Constants - Fisherman Theme
// Aquatic palette with deep teals for a calming, outdoor-ready UI

export const Colors = {
  // Primary Colors - Deep Teal Aquatic Theme
  primary: '#2C7A7B',        // Deep Teal - Primary Brand
  primaryDark: '#1D5A5B',
  primaryLight: '#319795',   // Ocean Teal
  
  // Secondary Colors
  secondary: '#319795',      // Ocean Gradient Start
  secondaryDark: '#285E61',  // Ocean Gradient End
  secondaryLight: '#4FD1C5',
  
  // Accent Colors
  accent: '#3182CE',         // Interactive Blue
  accentDark: '#2B6CB0',
  accentLight: '#63B3ED',
  
  // Neutral Colors
  background: '#F7F9FC',     // Very light grey-blue (reduces glare)
  surface: '#FFFFFF',        // Pure white for cards
  surfaceVariant: '#EDF2F7',
  
  // Text Colors
  textPrimary: '#1A202C',    // Dark slate
  textSecondary: '#718096',  // Cool grey for subtitles
  textTertiary: '#A0AEC0',
  textInverse: '#FFFFFF',
  
  // Status Colors - Semantic
  success: '#38A169',        // Safe green
  warning: '#D69E2E',        // Gold/Yellow for warnings
  error: '#E53E3E',
  info: '#3182CE',
  
  // Gradient Colors - Ocean Theme
  gradientPrimary: ['#2C7A7B', '#1D5A5B'] as const,
  gradientOcean: ['#319795', '#285E61'] as const,      // Weather card gradient
  gradientTeal: ['#2C7A7B', '#1D4E50'] as const,       // Primary button gradient
  gradientSurface: ['#FFFFFF', '#F7F9FC'] as const,
  
  // Card & UI specific
  cardBorder: '#E2E8F0',
  divider: '#E2E8F0',
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowTeal: 'rgba(44, 122, 123, 0.2)', // Colored shadow for teal elements
};

export const Typography = {
  // Font Sizes - Following design guide
  fontSize: {
    xs: 12,       // Micro labels
    sm: 14,       // Body text
    base: 16,     // H3/Card titles
    lg: 18,       // H2/Section headers
    xl: 20,
    '2xl': 24,    // H1/Greeting
    '3xl': 28,
    '4xl': 36,
    '5xl': 48,    // Big data (temperature)
    '6xl': 60,
  },
  
  // Font Weights
  fontWeight: {
    light: '300' as const,      // Big data display
    normal: '400' as const,     // Body/Micro labels
    medium: '500' as const,     // Section headers
    semibold: '600' as const,   // H1/H3/Card titles
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Font Families (using system fonts - Poppins-like)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const BorderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,         // Standard card radius
  xl: 20,
  '2xl': 24,      // Maximum rounded
  '3xl': 32,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    // Soft, diffused shadow per design guide
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  // Colored shadow for teal elements
  teal: {
    shadowColor: Colors.shadowTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const Animations = {
  // Duration
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  // Easing
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Scale
  scale: {
    small: 0.95,
    normal: 1,
    large: 1.05,
  },
  
  // Opacity
  opacity: {
    hidden: 0,
    visible: 1,
    disabled: 0.5,
  },
};

export const Layout = {
  // Container
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Card - Following design guide with rounded corners and soft shadows
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  
  // Gradient Card (for weather, hero sections)
  gradientCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  
  // Button
  button: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Input
  input: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  
  // Tab bar dimensions
  tabBar: {
    height: 75,
    borderRadius: BorderRadius['2xl'],
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
};
