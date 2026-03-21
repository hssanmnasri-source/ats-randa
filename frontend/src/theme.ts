import type { ThemeConfig } from 'antd';

export const COLORS = {
  primary: '#1a73e8',
  secondary: '#34a853',
  danger: '#ea4335',
  warning: '#fbbc04',
  dark: '#1a1a2e',
};

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: COLORS.primary,
    colorSuccess: COLORS.secondary,
    colorError: COLORS.danger,
    colorWarning: COLORS.warning,
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
};
