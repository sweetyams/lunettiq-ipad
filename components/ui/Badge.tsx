import { Text, StyleSheet, View } from 'react-native';
import Colors from '../../constants/Colors';

type Variant = 'default' | 'success' | 'warning' | 'error';

const COLORS: Record<Variant, { bg: string; text: string }> = {
  default: { bg: Colors.offWhite, text: Colors.navy },
  success: { bg: '#E8F5E9', text: Colors.green },
  warning: { bg: '#FFF3E0', text: '#E65100' },
  error: { bg: '#FFEBEE', text: Colors.error },
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: 13, fontWeight: '600' },
});
