import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '../../constants/Colors';

// MARK: - Section (grouped inset style)
export function Section({ title, children, style }: { title?: string; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// MARK: - Row (UITableViewCell equivalent)
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
        <View style={styles.iconWrap}>
          <FontAwesome name={icon} size={18} color={destructive ? Colors.error : Colors.navy} />
        </View>
      )}
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, destructive && { color: Colors.error }]}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      {onPress && accessory === 'disclosure' && <FontAwesome name="chevron-right" size={14} color={Colors.muted} />}
      {accessory === 'checkmark' && <FontAwesome name="check" size={16} color={Colors.green} />}
    </Wrapper>
  );
}

// MARK: - Separator
export function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginLeft: 16 },
  sectionContent: { backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, minHeight: 44 },
  iconWrap: { width: 30, alignItems: 'center', marginRight: 12 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 17, color: Colors.navy },
  rowSubtitle: { fontSize: 15, color: Colors.muted, marginTop: 2 },
  rowDetail: { fontSize: 15, color: Colors.muted, marginRight: 8 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 58 },
});
