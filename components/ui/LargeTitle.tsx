import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

export function LargeTitle({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: React.ReactNode }) {
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
  container: { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '300', color: Colors.navy, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: 4 },
});
