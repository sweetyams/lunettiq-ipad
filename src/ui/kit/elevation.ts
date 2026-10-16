import type { ViewStyle } from 'react-native';

/**
 * Found UI elevation (globals.css --shadow-raised / -float / -overlay), as
 * React Native shadow presets. Pair with a hairline border; depth never comes
 * from a grey background.
 */
export const elevation = {
  raised: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  float: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
  overlay: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
} satisfies Record<string, ViewStyle>;
