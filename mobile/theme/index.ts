import {
  colors,
  typography,
  spacing,
  radius,
  componentTokens,
  elevation,
  motion,
  sizes,
  stateOpacity,
  borderWidth,
  breakpoints,
} from "./tokens";

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  components: componentTokens,
  elevation,
  motion,
  sizes,
  stateOpacity,
  borderWidth,
  breakpoints,
} as const;

export type BioSachaTheme = typeof theme;
