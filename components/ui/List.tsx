import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';

export function Section({ title, children, style }: { title?: string; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  detail?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  onPress?: () => void;
  accessory?: 'disclosure' | 'checkmark' | 'none';
  destructive?: boolean;
}

export function Row({ title, subtitle, detail, icon, onPress, accessory = 'disclosure', destructive }: RowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={styles.row}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: destructive ? Colors.error : Colors.primary }]}>
          <FontAwesome name={icon} size={14} color={Colors.white} />
        </View>
      )}
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, destructive && { color: Colors.error }]}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      {onPress && accessory === 'disclosure' && <FontAwesome name="chevron-right" size={13} color={Colors.muted} style={{ marginLeft: 4 }} />}
      {accessory === 'checkmark' && <FontAwesome name="check" size={16} color={Colors.primary} style={{ marginLeft: 4 }} />}
    </Wrapper>
  );
}

export function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '500', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6, marginLeft: 16 },
  sectionContent: { backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
  iconWrap: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 17, color: Colors.black },
  rowSubtitle: { fontSize: 15, color: Colors.muted, marginTop: 1 },
  rowDetail: { fontSize: 17, color: Colors.muted, marginRight: 4 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 56 },
});
