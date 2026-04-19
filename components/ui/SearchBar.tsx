import { View, TextInput, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: Props) {
  return (
    <View style={styles.container}>
      <FontAwesome name="search" size={15} color={Colors.muted} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(142,142,147,0.12)', borderRadius: 10, paddingHorizontal: 10, height: 36 },
  icon: { marginRight: 6 },
  input: { flex: 1, fontSize: 17, color: Colors.black },
});
