import { View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Button, VerdictPicker } from '@/src/ui/kit';
import type { SessionPhoto, Verdict } from './fitting.types';

interface CompareViewProps {
  photos: SessionPhoto[];
  onClose: () => void;
  onVerdictChange?: (photoId: string, verdict: Verdict | null) => void;
}

/** Side-by-side photos (2–4) to help the client choose. */
export function CompareView({ photos, onClose, onVerdictChange }: CompareViewProps) {
  const width = photos.length <= 2 ? '48.5%' : '48.5%';
  return (
    <View className="flex-1 bg-bg-page">
      <View className="flex-row items-center justify-between px-[32px] py-[16px] border-b border-border">
        <View>
          <Text className="text-heading-lg text-text-primary">Compare</Text>
          <Text className="text-body-sm text-text-tertiary">{photos.length} photos side by side</Text>
        </View>
        <Button label="Done" variant="primary" onPress={onClose} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
        {photos.map((p) => (
          <View key={p.id} style={{ width }} className="border border-border rounded-lg overflow-hidden">
            <Image source={{ uri: p.localUri || p.thumbnailUri }} contentFit="cover" style={{ width: '100%', aspectRatio: photos.length <= 2 ? 3 / 4 : 4 / 3 }} />
            <View className="p-[16px] gap-[12px] border-t border-border">
              <Text className="text-body-lg font-medium text-text-primary" numberOfLines={1}>{p.productName ?? 'Frame not linked'}</Text>
              {p.notes ? <Text className="text-body-sm text-text-tertiary" numberOfLines={2}>{p.notes}</Text> : null}
              {onVerdictChange ? (
                <VerdictPicker value={p.verdict} onChange={(v) => onVerdictChange(p.id, v ?? null)} label={p.productName ?? 'photo'} />
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
