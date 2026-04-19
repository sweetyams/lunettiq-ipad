import { View, TextInput, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';

interface Props { value: string; onChangeText: (text: string) => void; placeholder?: string }

export function SearchBar({ value, onChangeText, placeholder = 'Search…' }: Props) {
  return (
    <View style={styles.container}>
      <FontAwesome name="search" size={13} color={Colors.muted} style={{ marginRight: 8 }} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.muted} style={styles.input} autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 2, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, height: 38 },
  input: { flex: 1, fontSize: 13, color: Colors.black },
});
