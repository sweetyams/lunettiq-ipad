import { Text, View } from 'react-native';

interface WordmarkProps {
  /** `inverse` for dark panels (lock, sign-in, splash), `default` on light surfaces. */
  tone?: 'default' | 'inverse';
  size?: 'md' | 'lg';
  /** Small line under the wordmark, e.g. the store name. */
  caption?: string;
}

/**
 * The LUNETTIQ wordmark as set on the storefront: light weight, wide tracking.
 * Shared by sign-in and lock screens so the brand reads the same everywhere.
 */
export function Wordmark({ tone = 'default', size = 'lg', caption }: WordmarkProps) {
  const color = tone === 'inverse' ? 'text-text-inverse' : 'text-text-primary';
  const captionColor = tone === 'inverse' ? 'text-chrome-text opacity-60' : 'text-text-muted';
  return (
    <View className="items-center" accessibilityRole="header" accessibilityLabel={caption ? `Lunettiq, ${caption}` : 'Lunettiq'}>
      <Text
        className={`${color} font-light`}
        style={{ fontSize: size === 'lg' ? 40 : 24, letterSpacing: size === 'lg' ? 14 : 8, paddingLeft: size === 'lg' ? 14 : 8 }}
      >
        LUNETTIQ
      </Text>
      {caption ? (
        <Text className={`${captionColor} text-body-sm mt-md tracking-widest uppercase`}>{caption}</Text>
      ) : null}
    </View>
  );
}
