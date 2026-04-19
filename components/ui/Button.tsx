import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '../../constants/Colors';

interface Props { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'outline'; style?: ViewStyle; small?: boolean }

export function Button({ title, onPress, variant = 'primary', style, small }: Props) {
  const bg = variant === 'primary' ? Colors.navy : variant === 'secondary' ? Colors.primary : 'transparent';
  const textColor = variant === 'outline' ? Colors.navy : Colors.white;
  const border = variant === 'outline' ? { borderWidth: 1, borderColor: Colors.border } : {};
  return (
    <Pressable onPress={onPress} style={[styles.btn, { backgroundColor: bg }, border, small && styles.small, style]}>
      <Text style={[styles.text, { color: textColor }, small && styles.smallText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 2, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  text: { fontSize: 13, fontWeight: '500' },
  small: { paddingHorizontal: 14, paddingVertical: 8, minHeight: 36 },
  smallText: { fontSize: 12 },
});
