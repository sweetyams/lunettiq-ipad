import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useCallback } from 'react';

import { useFittingStore } from '@/src/features/fitting/useFittingStore';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { Button } from '@/src/ui';
import { ModeStrip } from '@/src/ui/ModeStrip';
import type { SessionPhoto } from '@/src/features/fitting/fitting.types';

type Verdict = 'loved' | 'liked' | 'unsure' | 'rejected';

/**
 * ClientFittingReview — Screen 14 from wireframes
 *
 * Client-facing fitting review shown in HANDED mode.
 * Features:
 * - Green mode strip at top (CLIENT VIEW)
 * - Large heading "Your fitting" with body-xl type
 * - 4-column photo grid (280px tall placeholders)
 * - Verdict prompt card per photo with large buttons (56px min-height)
 * - No prices, no staff data, no internal info
 */
export function ClientFittingReview() {
  const { photos, setVerdict } = useFittingStore();
  const { activeClientName } = useSessionStore();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Only show client-visible photos
  const clientPhotos = photos.filter((p) => p.clientVisible);
  const activePhoto = clientPhotos[activePhotoIndex] ?? null;

  const handleVerdict = useCallback((verdict: Verdict) => {
    if (!activePhoto) return;
    setVerdict(activePhoto.id, verdict);
    // Advance to next unrated photo
    const nextUnrated = clientPhotos.findIndex(
      (p, i) => i > activePhotoIndex && !p.verdict,
    );
    if (nextUnrated !== -1) {
      setActivePhotoIndex(nextUnrated);
    }
  }, [activePhoto, activePhotoIndex, clientPhotos, setVerdict]);

  return (
    <View className="flex-1 bg-bg-page">
      {/* Green Mode Strip */}
      <ModeStrip />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-[48px] py-xl"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading — large type, client-facing language */}
        <Text className="text-heading-xl text-text-primary">Your fitting</Text>
        <Text className="text-body-xl text-text-secondary mt-xs">
          {clientPhotos.length > 0
            ? `${clientPhotos.length} photo${clientPhotos.length !== 1 ? 's' : ''} from today. Tell us how each one feels.`
            : 'No photos in this session yet.'}
        </Text>

        {/* Photo Grid — 4 columns */}
        {clientPhotos.length > 0 && (
          <View className="flex-row flex-wrap gap-lg mt-xl">
            {clientPhotos.map((photo, idx) => (
              <PhotoCell
                key={photo.id}
                photo={photo}
                isActive={idx === activePhotoIndex}
                onPress={() => setActivePhotoIndex(idx)}
              />
            ))}
          </View>
        )}

        {/* Verdict Prompt Card */}
        {activePhoto && (
          <View className="border border-border rounded-md bg-bg-surface mt-xl">
            <View className="flex-row items-center gap-lg p-md">
              <Text className="text-body-xl text-text-primary">
                How does <Text className="font-medium">{activePhoto.productId ? getProductLabel(activePhoto) : 'this frame'}</Text> feel?
              </Text>
              <View className="flex-row gap-md ml-auto">
                <VerdictButton
                  label="Love it"
                  verdict="loved"
                  isActive={activePhoto.verdict === 'loved'}
                  onPress={() => handleVerdict('loved')}
                />
                <VerdictButton
                  label="Like it"
                  verdict="liked"
                  isActive={activePhoto.verdict === 'liked'}
                  onPress={() => handleVerdict('liked')}
                />
                <VerdictButton
                  label="Not sure"
                  verdict="unsure"
                  isActive={activePhoto.verdict === 'unsure'}
                  onPress={() => handleVerdict('unsure')}
                />
                <VerdictButton
                  label="No"
                  verdict="rejected"
                  isActive={activePhoto.verdict === 'rejected'}
                  onPress={() => handleVerdict('rejected')}
                />
              </View>
            </View>
          </View>
        )}

        {/* Privacy note */}
        <Text className="text-body-md text-text-muted mt-md">
          Photos stay on your account and can be deleted at any time.
        </Text>
      </ScrollView>
    </View>
  );
}

// --- Photo Cell ---
interface PhotoCellProps {
  photo: SessionPhoto;
  isActive: boolean;
  onPress: () => void;
}

function PhotoCell({ photo, isActive, onPress }: PhotoCellProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-[23%]"
      accessibilityRole="button"
      accessibilityLabel={`Photo of ${getProductLabel(photo)}`}
    >
      {/* Photo placeholder */}
      <View
        className={`h-[280px] bg-bg-muted rounded-md items-center justify-center ${
          isActive ? 'border-2 border-brand' : ''
        }`}
      >
        <Text className="text-caption-md text-text-muted text-center px-sm">
          {photo.thumbnailUri ? 'Photo' : 'No preview'}
        </Text>
      </View>
      {/* Product name */}
      <Text className="text-body-lg font-medium text-text-primary mt-[12px]" numberOfLines={1}>
        {getProductLabel(photo)}
      </Text>
      <Text className="text-body-md text-text-muted">
        {photo.notes || 'frame'}
      </Text>
    </Pressable>
  );
}

// --- Verdict Button ---
interface VerdictButtonProps {
  label: string;
  verdict: Verdict;
  isActive: boolean;
  onPress: () => void;
}

function VerdictButton({ label, verdict, isActive, onPress }: VerdictButtonProps) {
  const activeClasses: Record<Verdict, string> = {
    loved: 'bg-brand border-brand',
    liked: 'bg-bg-inverse border-bg-inverse',
    unsure: 'bg-bg-surface border-border',
    rejected: 'bg-bg-surface border-border',
  };

  const activeTextClasses: Record<Verdict, string> = {
    loved: 'text-brand-text',
    liked: 'text-text-inverse',
    unsure: 'text-text-primary',
    rejected: 'text-text-primary',
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} verdict`}
      className={`min-h-[56px] px-[28px] rounded-sm items-center justify-center border ${
        isActive ? activeClasses[verdict] : 'bg-bg-surface border-border'
      }`}
    >
      <Text
        className={`text-body-lg font-medium ${
          isActive ? activeTextClasses[verdict] : 'text-text-primary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// --- Helper ---
function getProductLabel(photo: SessionPhoto): string {
  // Try to get a readable product name from the photo metadata
  // In production this would resolve via the product lookup
  return photo.productId ?? 'Frame';
}
