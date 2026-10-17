import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Smartphone } from 'lucide-react-native';
import { CameraCapturedPicture } from 'expo-camera';
import { useFittingStore } from '@/src/features/fitting/useFittingStore';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { ConsentModal } from '@/src/features/fitting/ConsentModal';
import { ShelfThumbnail } from '@/src/features/fitting/ShelfThumbnail';
import { CompareView } from '@/src/features/fitting/CompareView';
import { FrameDetailPopover } from '@/src/features/fitting/FrameDetailPopover';
import { HandedToClientView } from '@/src/features/fitting/HandedToClientView';
import { CaptureView } from '@/src/camera/CaptureView';
import { Button, elevation, kitColors } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import type { SessionPhoto } from '@/src/features/fitting/fitting.types';

export default function FittingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showCompareView, setShowCompareView] = useState(false);
  const [selectedPhotoForDetail, setSelectedPhotoForDetail] = useState<SessionPhoto | null>(null);
  
  // Stores
  const { activeClientId, activeClientName, mode, startFitting: startSessionFitting, endFitting: endSessionFitting } = useSessionStore();
  const { handedToClient, handToClient } = usePrivacyStore();
  const {
    isActive,
    consentStatus,
    photos,
    selectedPhotoIds,
    maxPhotos,
    startFitting: startFittingStore,
    endFitting: endFittingStore,
    setConsent,
    addPhoto,
    updatePhoto,
    removePhoto,
    setVerdict,
    toggleSelectForCompare,
    clearSelection,
  } = useFittingStore();

  // Verify session is active for this client
  useEffect(() => {
    if (!activeClientId || activeClientId !== id) {
      toast.error('No visit in progress', 'Start a visit with this client first.');
      router.back();
      return;
    }

    // Start fitting mode in both stores
    startFittingStore();
    startSessionFitting();

    // Cleanup on unmount — return to session mode
    return () => {
      endFittingStore();
      endSessionFitting();
    };
  }, [activeClientId, id, startFittingStore, startSessionFitting, endFittingStore, endSessionFitting, router]);

  const handleCapture = (photo: CameraCapturedPicture) => {
    // Check consent on first capture
    if (photos.length === 0 && consentStatus === 'pending') {
      return; // ConsentModal will handle this
    }

    // Don't capture if consent declined
    if (consentStatus === 'declined') {
      toast.info('No photos this visit', 'They declined photos.');
      return;
    }

    // Check photo limit
    if (photos.length >= maxPhotos) {
      toast.warning('Photo limit reached', `Up to ${maxPhotos} photos per visit. Delete one to take another.`);
      return;
    }

    // Create photo record from captured image
    const sessionPhoto: SessionPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      localUri: photo.uri,
      thumbnailUri: photo.uri, // TODO: Generate proper thumbnail
      r2Key: null,
      productId: null,
      productName: null,
      verdict: null,
      notes: '',
      clientVisible: true,
      capturedAt: Date.now(),
      uploadStatus: 'pending',
      isShortlisted: false,
    };

    addPhoto(sessionPhoto);
  };

  const handleConsentResponse = (granted: boolean) => {
    setConsent(granted);
    // Camera is now live, user can capture when ready
    if (!granted) {
      toast.info('No photos this visit', 'Keep logging frames and reactions in the visit tray.');
    }
  };

  // Leaving fitting returns to the visit; photos stay with the visit.
  const handleExit = () => {
    clearSelection();
    router.back();
  };

  const handlePhotoPress = (photo: SessionPhoto) => {
    setSelectedPhotoForDetail(photo);
  };

  const selectedPhotos = photos.filter(p => selectedPhotoIds.includes(p.id));
  const showConsentModal = photos.length === 0 && consentStatus === 'pending';

  // Show HANDED mode when device is handed to client
  if (handedToClient) {
    return <HandedToClientView />;
  }

  if (showCompareView && selectedPhotos.length >= 2) {
    return (
      <CompareView
        photos={selectedPhotos}
        onClose={() => {
          setShowCompareView(false);
          clearSelection();
        }}
        onVerdictChange={(photoId, verdict) => updatePhoto(photoId, { verdict })}
      />
    );
  }

  return (
    <View className="flex-1 bg-bg-page">
      <View className="flex-row items-center gap-[12px] px-[32px] py-[14px] border-b border-border">
        <View className="flex-1">
          <Text className="text-heading-lg text-text-primary">Fitting{activeClientName ? ` · ${activeClientName}` : ''}</Text>
          <Text className="text-body-sm text-text-tertiary">
            {consentStatus === 'declined' ? 'No photos this visit' : `${photos.length} of ${maxPhotos} photos`}
          </Text>
        </View>
        {photos.length > 0 ? <Button label="Hand to client" icon={Smartphone} variant="ghost" onPress={handToClient} /> : null}
        <Button label="Back to visit" variant="primary" onPress={handleExit} />
      </View>

      <View className="flex-1 bg-chrome-bg">
        {consentStatus === 'declined' ? (
          <View className="flex-1 items-center justify-center bg-bg-page gap-[12px] px-[32px]">
            <Camera size={32} color={kitColors.iconMuted} />
            <Text className="text-heading-lg text-text-primary">No photos this visit</Text>
            <Text className="text-body-md text-text-tertiary text-center max-w-[480px]">They didn’t want photos. Keep adding frames and their reactions in the visit tray.</Text>
            <Button label="Back to visit" onPress={handleExit} />
          </View>
        ) : (
          <CaptureView
            onCapture={handleCapture}
            maxPhotos={maxPhotos}
            currentCount={photos.length}
            disabled={photos.length >= maxPhotos}
            showMirrorToggle={true}
            onClose={handleExit}
          />
        )}

        {photos.length > 0 ? (
          <View className="absolute left-[24px] right-[24px] bottom-[24px] flex-row items-center gap-[12px] bg-bg-page border border-border rounded-lg px-[16px] py-[12px]" style={elevation.float}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, alignItems: 'flex-start' }} className="flex-1">
              {photos.map((photo) => (
                <ShelfThumbnail
                  key={photo.id}
                  photo={photo}
                  isSelected={selectedPhotoIds.includes(photo.id)}
                  onPress={() => handlePhotoPress(photo)}
                  onToggleSelect={() => toggleSelectForCompare(photo.id)}
                />
              ))}
            </ScrollView>
            <View className="items-end gap-[6px]">
              <Button
                label={selectedPhotoIds.length >= 2 ? `Compare ${selectedPhotoIds.length}` : 'Compare'}
                onPress={() => setShowCompareView(true)}
                disabled={selectedPhotoIds.length < 2}
              />
              {selectedPhotoIds.length < 2 ? <Text className="text-body-sm text-text-tertiary">Select 2–4</Text> : null}
            </View>
          </View>
        ) : null}
      </View>

      <ConsentModal
        isVisible={showConsentModal}
        clientName={activeClientName ?? 'Client'}
        onConsent={handleConsentResponse}
      />

      {selectedPhotoForDetail ? (
        <FrameDetailPopover
          photo={photos.find((p) => p.id === selectedPhotoForDetail.id) ?? selectedPhotoForDetail}
          visible
          onClose={() => setSelectedPhotoForDetail(null)}
          onUpdatePhoto={updatePhoto}
          onDelete={removePhoto}
        />
      ) : null}
    </View>
  );
}
