import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SectionLabel } from '../../components/ui/List';
import Colors from '../../constants/Colors';

export default function NewClient() {
  const { clients } = useApi();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [dupes, setDupes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'email' && val.length > 4) {
      clients.list({ q: val, limit: 3 }).then((r) => setDupes(Array.isArray(r) ? r : [])).catch(() => {});
    }
  };

  const save = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      Alert.alert('Required', 'First name, last name, and email are required.');
      return;
    }
    setSaving(true);
    try {
      const created = await clients.create(form);
      router.replace(`/client/${created.shopifyCustomerId}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
      <SectionLabel>Required</SectionLabel>
      <Card style={styles.formCard}>
        <FormField label="First Name" value={form.firstName} onChangeText={(v) => set('firstName', v)} autoFocus />
        <View style={styles.divider} />
        <FormField label="Last Name" value={form.lastName} onChangeText={(v) => set('lastName', v)} />
        <View style={styles.divider} />
        <FormField label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
      </Card>

      {dupes.length > 0 && (
        <>
          <SectionLabel style={{ marginTop: 20 }}>Possible Duplicates</SectionLabel>
          <Card style={styles.formCard}>
            {dupes.map((d, i) => (
              <View key={d.shopifyCustomerId}>
                {i > 0 && <View style={styles.divider} />}
                <Text onPress={() => router.replace(`/client/${d.shopifyCustomerId}`)} style={styles.dupeRow}>
                  {`${d.firstName || ''} ${d.lastName || ''}`.trim()} — {d.email}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}

      <SectionLabel style={{ marginTop: 20 }}>Optional</SectionLabel>
      <Card style={styles.formCard}>
        <FormField label="Phone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
      </Card>

      <View style={styles.footer}>
        <Button title={saving ? 'Saving…' : 'Create Client'} onPress={save} />
      </View>
    </ScrollView>
  );
}

function FormField({ label, value, onChangeText, ...props }: { label: string; value: string; onChangeText: (t: string) => void; [k: string]: any }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholderTextColor={Colors.muted} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 24, maxWidth: 500 },
  formCard: { padding: 0 },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.navy, width: 100 },
  input: { flex: 1, fontSize: 14, color: Colors.navy },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 16 },
  dupeRow: { padding: 14, fontSize: 13, color: Colors.primary },
  footer: { marginTop: 24 },
});
