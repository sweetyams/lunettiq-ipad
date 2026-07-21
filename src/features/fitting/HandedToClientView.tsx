import { View, Text, ScrollView, Pressable, Modal, Dimensions } from 'react-native';
import { useState } from 'react';
import { Star, X } from 'lucide-react-native';
import { useFittingStore } from './useFittingStore';
import { useSessionStore } from '../session/useSessionStore';
import { useHandedMode } from './useHandedMode';
import { VerdictControl } from './VerdictControl';
import { HandedTimeout } from './HandedTimeout';
import { Button } from '@/src/ui/Button';
import type { SessionPhoto } from './fitting.types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function HandedToClientView() {
  const { activeClientName } = useSessionStore();
  const { photos, setVerdict } = useFittingStore();
  const { timedOut, exitGesture, reclaim, handleClientVerdict } = useHandedMode();
  const [selectedPhoto, setSelectedPhoto] = useState<SessionPhoto | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<SessionPhoto | null>(null);

  // Show timeout screen if 10 minutes have passed
  if (timedOut) {
    return <HandedTimeout onReclaim={reclaim} />;
  }

  // Filter photos that are client-visible (no staff-only photos)
  const clientVisiblePhotos = photos.filter(photo => photo.clientVisible);

  const handlePhotoTap = (photo: SessionPhoto) => {
    setSelectedPhoto(photo);
  };

  const handleEnlarge = (photo: SessionPhoto) => {
    setEnlargedPhoto(photo);
  };

  const handleShortlist = (photoId: string) => {
    // Create shortlist action - simplified for client
    // TODO: Integrate with actual shortlist system
    console.log('Client shortlisted photo:', photoId);
  };

  const handleVerdictChange = (photoId: string, verdict: 'loved' | 'liked' | 'unsure' | 'rejected') => {
    handleClientVerdict(photoId, verdict);
  };

  return (
    <View className="flex-1 bg-bg-page">
      {/* Mode Strip - GREEN for HANDED mode — EXIT GESTURE AREA */}
      <Pressable
        onPress={exitGesture}
        onPressIn={() => console.log('[Handed] bar pressed')}
        className="min-h-[44px] items-center justify-center"
        style={{ backgroundColor: '#005D23' }}
        accessibilityRole="button"
        accessibilityLabel="Double tap to return to staff mode"
        accessibilityHint="Quickly tap twice to authenticate and exit client view"
      >
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 1.5 }}>
          DOUBLE-TAP TO EXIT
        </Text>
      </Pressable>

      {/* Header */}
      <View className="px-xl pt-lg pb-md bg-bg-elevated border-b border-border">
        <Text className="text-displayMd text-text-primary font-bold mb-xs">
          Your Fitting Session
        </Text>
        {activeClientName && (
          <Text className="text-body text-text-muted">
            Hi {activeClientName}, review your photos and let us know what you think!
          </Text>
        )}
      </View>

      {/* Photo Grid - Large thumbnails for client */}
      <ScrollView className="flex-1 px-xl pt-lg" showsVerticalScrollIndicator={false}>
        {clientVisiblePhotos.length === 0 ? (
          /* Empty State */
          <View className="flex-1 items-center justify-center py-2xl">
            <Text className="text-headline text-text-muted text-center mb-md">
              No photos yet
            </Text>
            <Text className="text-body text-text-muted text-center max-w-sm">
              Photos from your fitting session will appear here for you to review.
            </Text>
          </View>
        ) : (
          /* Photo Grid */
          <View className="flex-row flex-wrap justify-between">
            {clientVisiblePhotos.map((photo, index) => (
              <Pressable
                key={photo.id}
                onPress={() => handlePhotoTap(photo)}
                className={`
                  w-[48%] aspect-square rounded-lg mb-lg bg-bg-elevated border border-border overflow-hidden
                  ${selectedPhoto?.id === photo.id ? 'border-accent border-2' : ''}
                `}
                accessibilityRole="button"
                accessibilityLabel={`Photo ${index + 1}${photo.productName ? ` of ${photo.productName}` : ''}`}
                style={{ minHeight: 44, minWidth: 44 }} // Ensure 44pt minimum
              >
                {/* Mock photo - replace with actual Image component */}
                <View className="flex-1 bg-border items-center justify-center">
                  <Text className="text-text-muted text-caption">Photo {index + 1}</Text>
                </View>
                
                {/* Product name if available */}
                {photo.productName && (
                  <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-sm">
                    <Text className="text-text-inverse text-captionStrong" numberOfLines={1}>
                      {photo.productName}
                    </Text>
                  </View>
                )}
                
                {/* Verdict indicator */}
                {photo.verdict && (
                  <View className="absolute top-sm right-sm">
                    <View className="bg-bg-elevated rounded-full p-xs border border-border">
                      <Text className="text-xs">
                        {photo.verdict === 'loved' ? '❤️' : 
                         photo.verdict === 'liked' ? '👍' :
                         photo.verdict === 'unsure' ? '🤔' : '❌'}
                      </Text>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* Selected Photo Details */}
        {selectedPhoto && (
          <View className="bg-bg-elevated rounded-lg border border-border p-lg mb-xl">
            <View className="flex-row items-center justify-between mb-lg">
              <Text className="text-headline text-text-primary font-bold flex-1">
                {selectedPhoto.productName || 'Frame Details'}
              </Text>
              <Pressable
                onPress={() => handleEnlarge(selectedPhoto)}
                className="bg-bg-page px-md py-sm rounded-md min-h-[44px] min-w-[44px] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="View larger photo"
              >
                <Text className="text-bodyStrong text-text-primary">View Large</Text>
              </Pressable>
            </View>

            {/* Verdict Control - Client Voice Mode */}
            <View className="mb-lg">
              <Text className="text-bodyStrong text-text-primary mb-sm">How do you feel about this one?</Text>
              <VerdictControl
                value={selectedPhoto.verdict}
                onChange={(verdict) => handleVerdictChange(selectedPhoto.id, verdict)}
                size="large"
                clientVoice={true}
              />
            </View>

            <View className="flex-row gap-md">
              <View 
                accessibilityRole="button"
                accessibilityLabel="Add to shortlist"
                accessibilityHint="Double-tap to add this frame to your shortlist"
              >
                <Button
                  variant="primary"
                  onPress={() => handleShortlist(selectedPhoto.id)}
                  className="flex-1"
                >
                  <View className="flex-row items-center justify-center gap-xs">
                    <Star size={16} color="white" />
                    <Text className="text-text-inverse text-bodyStrong">This One!</Text>
                  </View>
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View className="bg-accent/10 rounded-lg p-lg mb-2xl">
          <Text className="text-bodyStrong text-accent mb-sm">How to use:</Text>
          <Text className="text-body text-text-primary leading-relaxed">
            • Tap any photo to select and rate it{'\n'}
            • Use the rating buttons to share your thoughts{'\n'}
            • Tap "This One!" to add favorites to your shortlist{'\n'}
            • Double-tap the green bar at the top when you're done
          </Text>
        </View>
      </ScrollView>

      {/* Enlarged Photo Modal */}
      <Modal
        visible={!!enlargedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEnlargedPhoto(null)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-xl">
          <View className="relative bg-bg-elevated rounded-lg overflow-hidden" style={{ maxWidth: screenWidth * 0.8, maxHeight: screenHeight * 0.8 }}>
            {/* Close button */}
            <Pressable
              onPress={() => setEnlargedPhoto(null)}
              className="absolute top-md right-md z-10 bg-black/50 rounded-full p-sm"
              accessibilityRole="button"
              accessibilityLabel="Close enlarged photo"
              style={{ minHeight: 44, minWidth: 44 }}
            >
              <X size={20} color="white" />
            </Pressable>

            {/* Large photo placeholder */}
            <View className="w-full aspect-square bg-border items-center justify-center">
              <Text className="text-text-muted text-body">Large Photo View</Text>
            </View>

            {/* Photo info */}
            {enlargedPhoto?.productName && (
              <View className="p-lg">
                <Text className="text-headline text-text-primary font-bold">
                  {enlargedPhoto.productName}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}