import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { Modal } from '@/src/ui/Modal';
import { Wordmark } from '@/src/ui/Wordmark';
import { VerdictPicker, kitColors } from '@/src/ui/kit';
import { useFittingStore } from './useFittingStore';
import { useSessionStore } from '../session/useSessionStore';
import { useHandedMode } from './useHandedMode';
import { HandedTimeout } from './HandedTimeout';
import type { SessionPhoto } from './fitting.types';

/**
 * Handed to client — the client holds the iPad and reacts to the frames they
 * tried (and any fitting photos). Client-facing: Lunettiq brand, large type,
 * no staff data. Staff take it back with a double-tap on the top bar (PIN).
 */
export function HandedToClientView() {
  const { activeClientName, framesTried, updateFrameVerdict } = useSessionStore();
  const { photos } = useFittingStore();
  const { timedOut, exitGesture, reclaim, handleClientVerdict } = useHandedMode();
  const [enlarged, setEnlarged] = useState<SessionPhoto | null>(null);
  const { width } = useWindowDimensions();

  if (timedOut) return <HandedTimeout onReclaim={reclaim} />;

  const firstName = activeClientName?.split(' ')[0];
  const clientPhotos = photos.filter((p) => p.clientVisible);
  const cols = width > 1100 ? 3 : 2;
  const cardWidth = (Math.min(width, 1280) - 64 - (cols - 1) * 24) / cols;
  const loved = framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked').length;

  return (
    <View className="flex-1 bg-bg-page">
      <Pressable
        onPress={exitGesture}
        className="min-h-[44px] items-center justify-center border-b border-border"
        accessibilityRole="button"
        accessibilityLabel="Staff: double-tap to take the iPad back"
      >
        <Text className="text-body-sm text-text-dim">Staff: double-tap here to take back</Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 32, paddingBottom: 64, alignItems: 'center' }}>
        <Wordmark size="md" />
        <Text className="text-display-lg text-text-primary text-center mt-[28px]">
          {firstName ? `${firstName}, which ones do you love?` : 'Which ones do you love?'}
        </Text>
        <Text className="text-body-lg text-text-tertiary text-center mt-[8px]">
          {loved ? `${loved} loved so far. ` : ''}Take your time. We’ll keep your favourites for you.
        </Text>

        {framesTried.length === 0 && clientPhotos.length === 0 ? (
          <Text className="text-body-lg text-text-tertiary text-center mt-[48px]">Nothing to show yet. Hand the iPad back to your advisor.</Text>
        ) : null}

        <View className="flex-row flex-wrap gap-[24px] mt-[32px] justify-center" style={{ maxWidth: 1280 }}>
          {framesTried.map((f) => (
            <View key={f.id} style={{ width: cardWidth }} className="border border-border rounded-lg overflow-hidden bg-bg-page">
              <View className="w-full items-center justify-center" style={{ aspectRatio: 4 / 3 }}>
                {f.imageUrl ? <Image source={{ uri: f.imageUrl }} contentFit="contain" style={{ width: '90%', height: '90%' }} accessibilityLabel={f.productName} /> : null}
              </View>
              <View className="p-[20px] gap-[14px] border-t border-border">
                <Text className="text-heading-lg text-text-primary" numberOfLines={1}>{f.productName}</Text>
                <VerdictPicker size="lg" value={f.verdict} onChange={(v) => updateFrameVerdict(f.id, v)} label={f.productName} />
              </View>
            </View>
          ))}
          {clientPhotos.map((p) => (
            <View key={p.id} style={{ width: cardWidth }} className="border border-border rounded-lg overflow-hidden bg-bg-page">
              <Pressable onPress={() => setEnlarged(p)} accessibilityRole="imagebutton" accessibilityLabel={`Enlarge photo${p.productName ? ` of ${p.productName}` : ''}`}>
                <Image source={{ uri: p.thumbnailUri || p.localUri }} contentFit="cover" style={{ width: '100%', aspectRatio: 4 / 3 }} />
              </Pressable>
              <View className="p-[20px] gap-[14px] border-t border-border">
                <Text className="text-heading-lg text-text-primary" numberOfLines={1}>{p.productName ?? 'Your photo'}</Text>
                <VerdictPicker size="lg" value={p.verdict} onChange={(v) => v && handleClientVerdict(p.id, v)} label={p.productName ?? 'photo'} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!enlarged} transparent animationType="fade" onRequestClose={() => setEnlarged(null)}>
        <View className="flex-1 bg-bg-page items-center justify-center">
          {enlarged ? <Image source={{ uri: enlarged.localUri }} contentFit="contain" style={{ width: '100%', height: '100%' }} /> : null}
          <Pressable onPress={() => setEnlarged(null)} className="absolute top-[32px] right-[32px] w-[56px] h-[56px] rounded-full border border-border bg-bg-page items-center justify-center" accessibilityRole="button" accessibilityLabel="Close photo">
            <X size={24} color={kitColors.text} />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
