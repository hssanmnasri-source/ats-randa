import type { ThemeConfig } from 'antd';

export const COLORS = {
  primary:      '#8B1A1A',
  primaryHover: '#A52020',
  primaryDark:  '#6B1414',
  gold:         '#C9A84C',
  goldLight:    '#F0D080',
  goldDark:     '#A8833A',
  darkBrown:    '#3D0C02',
  white:        '#FFFFFF',
  grayBg:       '#F5F5F5',
  grayBorder:   '#E8E8E8',
  textDark:     '#1A1A1A',
  textMedium:   '#595959',
  success:      '#52C41A',
  warning:      '#FAAD14',
  error:        '#FF4D4F',
  sidebarBg:    '#3D0C02',
  sidebarText:  '#F0D080',
  // legacy aliases
  dark:         '#3D0C02',
  secondary:    '#52C41A',
  danger:       '#FF4D4F',
};

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary:        '#8B1A1A',
    colorPrimaryHover:   '#A52020',
    colorPrimaryActive:  '#6B1414',
    colorLink:           '#8B1A1A',
    colorLinkHover:      '#A52020',
    colorSuccess:        '#52C41A',
    colorWarning:        '#FAAD14',
    colorError:          '#FF4D4F',
    borderRadius:        8,
    borderRadiusLG:      12,
    fontFamily:          "'Inter', 'Segoe UI', sans-serif",
    fontSize:            14,
    colorBgContainer:    '#FFFFFF',
    colorBgLayout:       '#F5F5F5',
    colorBorder:         '#E8E8E8',
    colorTextHeading:    '#1A1A1A',
  },
  components: {
    Button: {
      colorPrimary:      '#8B1A1A',
      algorithm:         true,
    },
    Menu: {
      darkItemBg:            '#3D0C02',
      darkSubMenuItemBg:     '#2A0901',
      darkItemSelectedBg:    '#8B1A1A',
      darkItemColor:         '#F0D080',
      darkItemSelectedColor: '#FFFFFF',
      darkItemHoverBg:       '#5C1010',
      darkItemHoverColor:    '#FFFFFF',
    },
    Layout: {
      siderBg:   '#3D0C02',
      headerBg:  '#FFFFFF',
      bodyBg:    '#F5F5F5',
    },
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      headerBg:    '#3D0C02',
      borderColor: '#E8E8E8',
    },
    Tag: {
      colorPrimary: '#8B1A1A',
    },
  },
};
