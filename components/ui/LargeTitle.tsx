import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

interface Props {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}

export function LargeTitle({ title, subtitle, trailing }: Props) {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 34, fontWeight: '700', color: Colors.black, letterSpacing: 0.4 },
  subtitle: { fontSize: 17, color: Colors.muted, marginTop: 2 },
});
