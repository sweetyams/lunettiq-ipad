import { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Section, Row, Separator } from '../../components/ui/List';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';

export default function CustomDesignIntake() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const { clients } = useApi();
  const router = useRouter();

  const [photos, setPhotos] = useState<string[]>([]);
  const [shape, setShape] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [features, setFeatures] = useState('');
  const [notes, setNotes] = useState('');

  const addPhoto = async () => {
    if (photos.length >= 6) { Alert.alert('Limit', 'Maximum 6 reference photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setPhotos((p) => [...p, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    if (photos.length >= 6) { Alert.alert('Limit', 'Maximum 6 reference photos.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setPhotos((p) => [...p, result.assets[0].uri]);
    }
  };

  const submit = async () => {
    if (!clientId) { Alert.alert('Error', 'No client selected.'); return; }
    try {
      await clients.addTimeline(clientId, {
        type: 'custom_design',
        notes: JSON.stringify({ shape, color, size, features, notes, photoCount: photos.length }),
      });
      Alert.alert('Submitted', 'Custom design draft saved.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
      <Section title={`Reference Photos (${photos.length}/6)`}>
        <ScrollView horizontal style={styles.photoRow} contentContainerStyle={{ gap: 8, padding: 16 }}>
          {photos.map((uri, i) => <Image key={i} source={{ uri }} style={styles.photoThumb} />)}
        </ScrollView>
        <View style={styles.photoActions}>
          <Button title="Take Photo" onPress={takePhoto} variant="secondary" style={{ flex: 1 }} />
          <Button title="From Library" onPress={addPhoto} variant="outline" style={{ flex: 1 }} />
        </View>
      </Section>

      <Section title="Modifications">
        <Field label="Shape" value={shape} onChangeText={setShape} placeholder="Rounder, more angular..." />
        <Separator />
        <Field label="Color" value={color} onChangeText={setColor} placeholder="Material color preference..." />
        <Separator />
        <Field label="Size" value={size} onChangeText={setSize} placeholder="Wider, narrower..." />
        <Separator />
        <Field label="Features" value={features} onChangeText={setFeatures} placeholder="Engraving, hinge style..." />
      </Section>

      <Section title="Additional Notes">
        <TextInput style={styles.notesInput} value={notes} onChangeText={setNotes} placeholder="Anything else..." placeholderTextColor={Colors.muted} multiline />
      </Section>

      <View style={styles.footer}>
        <Button title="Submit Draft" onPress={submit} variant="secondary" />
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (t: string) => void; placeholder: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.offWhite },
  content: { paddingBottom: 40 },
  photoRow: { maxHeight: 110 },
  photoThumb: { width: 90, height: 90, borderRadius: 10 },
  photoActions: { flexDirection: 'row', gap: 10, padding: 16 },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 44 },
  label: { fontSize: 17, color: Colors.navy, width: 90 },
  input: { flex: 1, fontSize: 17, color: Colors.navy, paddingVertical: 12 },
  notesInput: { fontSize: 17, color: Colors.navy, padding: 16, minHeight: 80, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 20, marginTop: 12 },
});
