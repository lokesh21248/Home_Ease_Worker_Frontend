import { TextStyle, Platform } from 'react-native';

const systemFont = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const fontFamily = {
  regular: systemFont,
  medium: systemFont,
  semiBold: systemFont,
  bold: systemFont,
};

export interface TypographyTokens {
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  fontFamily: typeof fontFamily;
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  subtitle1: TextStyle;
  subtitle2: TextStyle;
  body1: TextStyle;
  body2: TextStyle;
  caption: TextStyle;
  button: TextStyle;
  [key: string]: any;
}

export const typography: TypographyTokens = {
  fontSize,
  fontWeight,
  fontFamily,
  h1: {
    fontFamily: systemFont,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: systemFont,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: systemFont,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  subtitle1: {
    fontFamily: systemFont,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  subtitle2: {
    fontFamily: systemFont,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  body1: {
    fontFamily: systemFont,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  body2: {
    fontFamily: systemFont,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontFamily: systemFont,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  button: {
    fontFamily: systemFont,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
};
