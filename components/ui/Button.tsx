import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '../../constants/Colors';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', style }: Props) {
  const bg = variant === 'primary' ? Colors.black : variant === 'secondary' ? Colors.primary : 'transparent';
  const textColor = variant === 'outline' ? Colors.primary : Colors.white;
  const border = variant === 'outline' ? { borderWidth: 1.5, borderColor: Colors.primary } : {};

  return (
    <Pressable onPress={onPress} style={[styles.btn, { backgroundColor: bg }, border, style]}>
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 44, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 17, fontWeight: '600' },
});
