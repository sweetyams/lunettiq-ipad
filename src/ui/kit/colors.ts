/**
 * Found UI colours for places that need a raw value (icon `color` props,
 * ActivityIndicator). Mirrors tailwind.config.js; use className tokens everywhere else.
 */
export const kitColors = {
  text: '#0A0A0A',
  textSecondary: '#52525B',
  textTertiary: '#71717A',
  icon: '#52525B',
  iconMuted: '#A1A1AA',
  inverse: '#FFFFFF',
  primary: '#171717',
  border: '#E4E4E7',
  subtle: '#F7F7F7',
  success: '#008053',
  warning: '#C76A18',
  danger: '#E7000B',
  info: '#0077BA',
  brand: '#023891',
} as const;
