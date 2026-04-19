import { Text, View, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

type Variant = 'default' | 'tier1' | 'tier2' | 'tier3' | 'success' | 'warning' | 'error';

const COLORS: Record<Variant, { bg: string; text: string }> = {
  default: { bg: Colors.cream, text: Colors.muted },
  tier1: { bg: Colors.cream, text: Colors.muted },
  tier2: { bg: '#EBEBEB', text: '#333' },
  tier3: { bg: Colors.black, text: Colors.white },
  success: { bg: Colors.primaryLight, text: Colors.primary },
  warning: { bg: Colors.goldLight, text: Colors.gold },
  error: { bg: Colors.errorLight, text: Colors.error },
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
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
});
