import { Text, StyleSheet, View } from 'react-native';
import Colors from '../../constants/Colors';

type Variant = 'default' | 'success' | 'warning' | 'error';

const COLORS: Record<Variant, { bg: string; text: string }> = {
  default: { bg: 'rgba(14,15,208,0.08)', text: Colors.primary },
  success: { bg: 'rgba(52,199,89,0.1)', text: Colors.success },
  warning: { bg: 'rgba(255,149,0,0.1)', text: '#FF9500' },
  error: { bg: 'rgba(255,59,48,0.1)', text: Colors.error },
};

export function Badge({ label, variant = 'default' }: { label: string; variant?: Variant }) {
  const c = COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  text: { fontSize: 13, fontWeight: '600' },
});
