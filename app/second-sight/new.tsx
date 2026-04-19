import { useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TextInput, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Section, Row, Separator } from '../../components/ui/List';
import { SearchBar } from '../../components/ui/SearchBar';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';

const STEPS = ['Frame', 'Photos', 'Grade', 'Review'];
const PHOTO_LABELS = ['Front', '3/4 Angle', 'Temple Detail', 'Lens Close-up'];
const GRADES = [
  { value: 'A', label: 'Grade A', desc: 'Excellent — minimal wear' },
  { value: 'B', label: 'Grade B', desc: 'Good — light scratches or wear' },
  { value: 'C', label: 'Grade C', desc: 'Fair — visible wear, donate option' },
];

export default function SecondSightIntake() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const { secondSight, products } = useApi();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState(0);
  const [frameQuery, setFrameQuery] = useState('');
  const [frameResults, setFrameResults] = useState<any[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');

  const searchFrame = (q: string) => {
    setFrameQuery(q);
    if (q.length >= 2) products.list({ q, limit: 5 }).then(setFrameResults).catch(() => {});
  };

  const capturePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (photo) setPhotos((p) => [...p, photo.uri]);
  };

  const submit = async () => {
    try {
      await secondSight.create({
        clientId,
        frameId: selectedFrame?.id,
        frameName: selectedFrame?.title || frameQuery,
        grade,
        photos,
        notes,
      });
      Alert.alert('Submitted', 'Second Sight intake created.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
      {/* Step indicator */}
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              <Text style={[styles.stepNum, i <= step && { color: Colors.white }]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === step && { color: Colors.navy, fontWeight: '600' }]}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Step 0: Frame ID */}
      {step === 0 && (
        <>
          <Section title="Identify Frame">
            <View style={{ padding: 16 }}>
              <SearchBar value={frameQuery} onChangeText={searchFrame} placeholder="Search frame model..." />
            </View>
            {frameResults.map((f, i) => (
              <View key={f.id}>
                <Separator />
                <Row title={f.title} subtitle={f.vendor} onPress={() => { setSelectedFrame(f); setFrameQuery(f.title); setFrameResults([]); }} accessory={selectedFrame?.id === f.id ? 'checkmark' : 'disclosure'} />
              </View>
            ))}
          </Section>
          <Button title="Next" onPress={() => setStep(1)} style={styles.nextBtn} />
        </>
      )}

      {/* Step 1: Photos */}
      {step === 1 && (
        <>
          <Section title={`Condition Photos (${photos.length}/4)`}>
            {!permission?.granted ? (
              <View style={{ padding: 16 }}>
                <Button title="Allow Camera" onPress={requestPermission} />
              </View>
            ) : (
              <>
                <View style={styles.cameraSmall}>
                  <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
                </View>
                <View style={{ padding: 16 }}>
                  <Text style={styles.photoHint}>{photos.length < 4 ? `Next: ${PHOTO_LABELS[photos.length]}` : 'All photos captured'}</Text>
                  {photos.length < 4 && <Button title={`Capture ${PHOTO_LABELS[photos.length]}`} onPress={capturePhoto} style={{ marginTop: 8 }} />}
                </View>
                <ScrollView horizontal style={styles.photoRow} contentContainerStyle={{ gap: 8, padding: 16 }}>
                  {photos.map((uri, i) => (
                    <View key={i}>
                      <Image source={{ uri }} style={styles.photoThumb} />
                      <Text style={styles.photoLabel}>{PHOTO_LABELS[i]}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </Section>
          <View style={styles.navRow}>
            <Button title="Back" onPress={() => setStep(0)} variant="outline" />
            <Button title="Next" onPress={() => setStep(2)} />
          </View>
        </>
      )}

      {/* Step 2: Grade */}
      {step === 2 && (
        <>
          <Section title="Condition Grade">
            {GRADES.map((g, i) => (
              <View key={g.value}>
                {i > 0 && <Separator />}
                <Row title={g.label} subtitle={g.desc} onPress={() => setGrade(g.value)} accessory={grade === g.value ? 'checkmark' : 'disclosure'} />
              </View>
            ))}
          </Section>
          <Section title="Notes">
            <TextInput style={styles.notesInput} value={notes} onChangeText={setNotes} placeholder="Condition details..." placeholderTextColor={Colors.muted} multiline />
          </Section>
          <View style={styles.navRow}>
            <Button title="Back" onPress={() => setStep(1)} variant="outline" />
            <Button title="Next" onPress={() => setStep(3)} />
          </View>
        </>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <>
          <Section title="Review">
            <Row title="Frame" detail={selectedFrame?.title || frameQuery || '—'} accessory="none" />
            <Separator />
            <Row title="Photos" detail={`${photos.length}/4`} accessory="none" />
            <Separator />
            <Row title="Grade" detail={grade || '—'} accessory="none" />
            <Separator />
            <Row title="Notes" detail={notes || '—'} accessory="none" />
          </Section>
          <View style={styles.navRow}>
            <Button title="Back" onPress={() => setStep(2)} variant="outline" />
            <Button title="Submit Intake" onPress={submit} variant="secondary" />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.offWhite },
  content: { paddingBottom: 40 },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 20 },
  stepItem: { alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.navy },
  stepNum: { fontSize: 15, fontWeight: '700', color: Colors.muted },
  stepLabel: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  nextBtn: { marginHorizontal: 20, marginTop: 12 },
  navRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 12 },
  cameraSmall: { height: 240, margin: 16, borderRadius: 12, overflow: 'hidden' },
  photoHint: { fontSize: 15, color: Colors.muted },
  photoRow: { maxHeight: 110 },
  photoThumb: { width: 80, height: 80, borderRadius: 8 },
  photoLabel: { fontSize: 11, color: Colors.muted, textAlign: 'center', marginTop: 4 },
  notesInput: { fontSize: 17, color: Colors.navy, padding: 16, minHeight: 80, textAlignVertical: 'top' },
});
