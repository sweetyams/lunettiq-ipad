import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Colors from '../../constants/Colors';

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const Wrapper = onPress ? Pressable : View;
  return <Wrapper onPress={onPress} style={[styles.card, style]}>{children}</Wrapper>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: 0, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
});
