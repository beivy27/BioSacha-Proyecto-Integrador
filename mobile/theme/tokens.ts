// BioSacha - Sistema de diseño Semana 10
// Nivel 1: Tokens primitivos
export const primitiveColors = {
  green900: "#0B5D3B",
  green700: "#166534",
  white: "#FFFFFF",
  gray50: "#F4F8F5",
  gray800: "#1F2937",
  gray600: "#4B5563",
  red700: "#B42318",
  amber800: "#7A4D00",
};

// Nivel 2: Tokens semánticos
export const colors = {
  background: primitiveColors.white,
  surface: primitiveColors.gray50,

  actionPrimary: primitiveColors.green900,
  textOnPrimary: primitiveColors.white,

  textPrimary: primitiveColors.gray800,
  textSecondary: primitiveColors.gray600,

  success: primitiveColors.green700,
  error: primitiveColors.red700,
  warning: primitiveColors.amber800,
};

// Tipografía
export const typography = {
  titleLarge: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
};

// Espaciado basado en múltiplos de 8
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Radios
export const radius = {
  small: 8,
  medium: 12,
  large: 16,
};


// Elevación / sombra
export const elevation = {
  none: 0,
  card: 2,
  raised: 4,
};

// Duraciones de animación
export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// Tamaños mínimos accesibles
export const sizes = {
  touchTarget: 48,
};


// Estados visuales
export const stateOpacity = {
  pressed: 0.85,
  disabled: 0.5,
};


// Grosores de borde
export const borderWidth = {
  thin: 1,
};


// Puntos de quiebre adaptativos
export const breakpoints = {
  wide: 700,
};

// Nivel 3: Tokens de componente
export const componentTokens = {
  primaryButtonBackground: colors.actionPrimary,
  primaryButtonText: colors.textOnPrimary,
  cardBackground: colors.surface,
  cardRadius: radius.medium,
  cardPadding: spacing.md,
};
