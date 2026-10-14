/**
 * Single source of design tokens. Components must not hard-code colors, sizes or fonts.
 * Palette: soft pastels (cream, peach, lavender, mint) with a warm plum ink for contrast.
 */
export const palette = {
  cream: '#FFF6EC',
  creamDeep: '#F6E7D4',
  peach: '#FFC9A9',
  peachDeep: '#F59E7A',
  lavender: '#CDB8F0',
  lavenderDeep: '#9C82D4',
  mint: '#BDE8D3',
  mintDeep: '#4FAF85',
  rose: '#F4B6C2',
  roseDeep: '#D9667E',
  plum: '#4A3B4F',
  plumSoft: '#7A6A80',
  white: '#FFFFFF',
} as const;

export const colors = {
  background: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.creamDeep,
  text: palette.plum,
  textMuted: palette.plumSoft,
  textOnPrimary: palette.white,
  primary: palette.peachDeep,
  primarySoft: palette.peach,
  secondary: palette.lavenderDeep,
  secondarySoft: palette.lavender,
  success: palette.mintDeep,
  successSoft: palette.mint,
  danger: palette.roseDeep,
  dangerSoft: palette.rose,
  border: '#EAD8C3',
  locked: '#D8CCC0',
  star: '#F5A65B',
  starEmpty: '#E6D6C4',
  overlay: 'rgba(74, 59, 79, 0.35)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Font family names registered in the root layout (bundled Fredoka, SIL OFL). */
export const fonts = {
  regular: 'Fredoka-Regular',
  medium: 'Fredoka-Medium',
  semibold: 'Fredoka-SemiBold',
  bold: 'Fredoka-Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 48 },
  title: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 24 },
  button: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Minimum touch target (Material guidance is 48dp). */
export const touchTarget = 56;

export const shadow = {
  card: {
    shadowColor: palette.plum,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const theme = { palette, colors, spacing, radii, fonts, typography, touchTarget, shadow };
export type Theme = typeof theme;
