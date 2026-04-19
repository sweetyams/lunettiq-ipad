import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';

export function SectionLabel({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function Section({ title, children, style }: { title?: string; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.section, style]}>
      {title && <SectionLabel>{title}</SectionLabel>}
      {children}
    </View>
  );
}

interface RowProps {
  title: string; subtitle?: string; detail?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  onPress?: () => void; accessory?: 'disclosure' | 'checkmark' | 'none'; destructive?: boolean;
}

export function Row({ title, subtitle, detail, icon, onPress, accessory = 'disclosure', destructive }: RowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={styles.row}>
      {icon && <FontAwesome name={icon} size={14} color={destructive ? Colors.error : Colors.muted} style={{ marginRight: 12, width: 18 }} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, destructive && { color: Colors.error }]}>{title}</Text>
        {subtitle && <Text style={styles.rowSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      {onPress && accessory === 'disclosure' && <FontAwesome name="chevron-right" size={12} color={Colors.muted} style={{ marginLeft: 6 }} />}
      {accessory === 'checkmark' && <FontAwesome name="check" size={14} color={Colors.primary} style={{ marginLeft: 6 }} />}
    </Wrapper>
  );
}

export function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: Colors.muted, textTransform: 'uppercase', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16, minHeight: 44, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderTopWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  rowSub: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  rowDetail: { fontSize: 13, color: Colors.muted, marginRight: 6 },
  sep: { height: 0 },
});
