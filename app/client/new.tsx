import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Section, Row, Separator } from '../../components/ui/List';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';
import type { Client } from '../../lib/types';

export default function NewClient() {
  const { clients } = useApi();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [dupes, setDupes] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    // Duplicate check on email
    if (key === 'email' && val.length > 4) {
      clients.list({ q: val, limit: 3 }).then(setDupes).catch(() => {});
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
      <Section title="Required">
        <Field label="First Name" value={form.firstName} onChangeText={(v) => set('firstName', v)} autoFocus />
        <Separator />
        <Field label="Last Name" value={form.lastName} onChangeText={(v) => set('lastName', v)} />
        <Separator />
        <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
      </Section>

      {dupes.length > 0 && (
        <Section title="Possible Duplicates">
          {dupes.map((d, i) => (
            <View key={d.shopifyCustomerId}>
              {i > 0 && <Separator />}
              <Row title={`${d.firstName} ${d.lastName}`} subtitle={d.email} onPress={() => router.replace(`/client/${d.shopifyCustomerId}`)} />
            </View>
          ))}
        </Section>
      )}

      <Section title="Optional">
        <Field label="Phone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
      </Section>

      <View style={styles.footer}>
        <Button title={saving ? 'Saving...' : 'Create Client'} onPress={save} />
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, ...props }: { label: string; value: string; onChangeText: (t: string) => void; [k: string]: any }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholderTextColor={Colors.muted} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: 16, paddingBottom: 40 },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 44 },
  label: { fontSize: 17, color: Colors.black, width: 110 },
  input: { flex: 1, fontSize: 17, color: Colors.black, paddingVertical: 12 },
  footer: { paddingHorizontal: 20, marginTop: 8 },
});
