import { useState, useRef } from 'react';
import { View, Text, ScrollView, Image, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '../../components/ui/Button';
import { Section, Row, Separator } from '../../components/ui/List';
import { useAppStore } from '../../lib/store';
import { useSessionAutoSave } from '../../lib/useSessionAutoSave';
import Colors from '../../constants/Colors';
import type { TryOnPhoto } from '../../lib/types';

const VERDICTS = ['loved', 'liked', 'unsure', 'rejected'] as const;
const VERDICT_ICONS: Record<string, { icon: string; color: string }> = {
  loved: { icon: 'heart', color: Colors.error },
  liked: { icon: 'thumbs-up', color: Colors.primary },
  unsure: { icon: 'question-circle', color: Colors.muted },
  rejected: { icon: 'thumbs-down', color: Colors.muted },
};

export default function FittingScreen() {
  const { clientId, sessionId } = useLocalSearchParams<{ clientId: string; sessionId: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<TryOnPhoto[]>([]);
  const [selected, setSelected] = useState<TryOnPhoto | null>(null);
  const { addPhoto: queuePhoto } = useAppStore();

  // Auto-save session state every 30s
  useSessionAutoSave(photos.length > 0 ? { framesTried: photos.map((p) => ({ productId: '', photos: [p.uri], verdict: p.verdict, notes: p.notes })) } as any : null);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>Camera access is needed for fitting photos.</Text>
        <Button title="Allow Camera" onPress={requestPermission} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const capture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (!photo) return;
    const id = Date.now().toString();
    const newPhoto: TryOnPhoto = { id, sessionId: sessionId || '', uri: photo.uri };
    setPhotos((prev) => [...prev, newPhoto]);
    setSelected(newPhoto);
    // Queue for background upload
    queuePhoto({ id, localUri: photo.uri, clientId: clientId || '', sessionId: sessionId || '', status: 'pending' });
  };

  const updatePhoto = (id: string, updates: Partial<TryOnPhoto>) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
    if (selected?.id === id) setSelected((s) => s ? { ...s, ...updates } : s);
  };

  return (
    <View style={styles.container}>
      {/* Camera + capture */}
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.captureBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={20} color={Colors.white} />
          </Pressable>
          <Pressable onPress={capture} style={styles.shutter}>
            <View style={styles.shutterInner} />
          </Pressable>
          <Text style={styles.count}>{photos.length} photos</Text>
        </View>
      </View>

      {/* Shelf + detail */}
      <View style={styles.bottom}>
        {/* Thumbnail shelf */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shelf} contentContainerStyle={styles.shelfContent}>
          {photos.map((p) => (
            <Pressable key={p.id} onPress={() => setSelected(p)} style={[styles.thumb, selected?.id === p.id && styles.thumbSelected]}>
              <Image source={{ uri: p.uri }} style={styles.thumbImg} />
              {p.verdict && (
                <View style={styles.verdictDot}>
                  <FontAwesome name={VERDICT_ICONS[p.verdict].icon as any} size={10} color={VERDICT_ICONS[p.verdict].color} />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Selected photo detail */}
        {selected && (
          <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
            <Section title="Verdict">
              <View style={styles.verdictRow}>
                {VERDICTS.map((v) => (
                  <Pressable key={v} onPress={() => updatePhoto(selected.id, { verdict: v })} style={[styles.verdictBtn, selected.verdict === v && styles.verdictActive]}>
                    <FontAwesome name={VERDICT_ICONS[v].icon as any} size={18} color={selected.verdict === v ? Colors.white : VERDICT_ICONS[v].color} />
                    <Text style={[styles.verdictLabel, selected.verdict === v && { color: Colors.white }]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            </Section>
            <Section title="Notes">
              <TextInput
                style={styles.notesInput}
                value={selected.notes || ''}
                onChangeText={(t) => updatePhoto(selected.id, { notes: t })}
                placeholder="Frame notes..."
                placeholderTextColor={Colors.muted}
                multiline
              />
            </Section>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, padding: 20 },
  body: { fontSize: 17, color: Colors.black, textAlign: 'center' },
  cameraWrap: { flex: 3 },
  camera: { flex: 1 },
  captureBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { position: 'absolute', left: 20, bottom: 28, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.white },
  count: { position: 'absolute', right: 20, bottom: 32, color: Colors.white, fontSize: 15, fontWeight: '600' },
  bottom: { flex: 2, backgroundColor: Colors.bg },
  shelf: { maxHeight: 90, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  shelfContent: { padding: 10, gap: 8 },
  thumb: { width: 70, height: 70, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbSelected: { borderColor: Colors.black },
  thumbImg: { width: '100%', height: '100%' },
  verdictDot: { position: 'absolute', bottom: 2, right: 2, backgroundColor: Colors.white, borderRadius: 8, padding: 2 },
  detail: { flex: 1 },
  detailContent: { paddingTop: 8 },
  verdictRow: { flexDirection: 'row', padding: 12, gap: 8 },
  verdictBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, minHeight: 44 },
  verdictActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  verdictLabel: { fontSize: 12, marginTop: 4, color: Colors.black, fontWeight: '600' },
  notesInput: { fontSize: 17, color: Colors.black, padding: 16, minHeight: 80, textAlignVertical: 'top' },
});
