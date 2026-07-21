import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Hand } from 'lucide-react-native';
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
import { Button } from '@/src/ui/Button';
import { TopBar } from '@/src/ui/TopBar';
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
      toast.error('No Active Session', 'Please start a session with this client first.');
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
      toast.warning('No Photo Mode', 'Photos are disabled for this session. Use barcode scanner to log frames tried.');
      return;
    }

    // Check photo limit
    if (photos.length >= maxPhotos) {
      toast.warning('Photo Limit Reached', `Maximum ${maxPhotos} photos per session`);
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
    };

    addPhoto(sessionPhoto);
  };

  const handleConsentResponse = (granted: boolean) => {
    setConsent(granted);
    // Camera is now live, user can capture when ready
    if (!granted) {
      toast.info('No Photo Mode', 'You can still log frames tried using the barcode scanner.');
    }
  };

  const handleExit = () => {
    Alert.alert(
      'End Fitting Session',
      'Are you sure you want to end the fitting session?',
      [
        { text: 'Continue Fitting', style: 'cancel' },
        { 
          text: 'End Session', 
          style: 'destructive',
          onPress: () => {
            clearSelection();
            router.back();
          }
        }
      ]
    );
  };

  const handlePhotoPress = (photo: SessionPhoto) => {
    setSelectedPhotoForDetail(photo);
  };

  const handleUpdatePhoto = (id: string, updates: Partial<SessionPhoto>) => {
    updatePhoto(id, updates);
  };

  const handleDeletePhoto = (id: string) => {
    removePhoto(id);
  };

  const handleShortlistPhoto = (id: string) => {
    // TODO: Integrate with actual shortlist functionality
    console.log('Shortlisting photo:', id);
  };

  const handleRelinkPhoto = (id: string) => {
    // TODO: Open product search/barcode scanner
    console.log('Relinking photo:', id);
    Alert.alert(
      'Link Product',
      'This will open the product search or barcode scanner.',
      [{ text: 'OK' }]
    );
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
        onVerdictChange={setVerdict}
      />
    );
  }

  return (
    <View className="flex-1 bg-neutral-900">
      {/* TopBar - minimal variant for fitting mode */}
      <TopBar 
        variant="minimal" 
        onExit={handleExit}
        photoCount={photos.length}
      />

      {/* Camera Feed Area */}
      <View className="flex-1">
        {consentStatus === 'declined' ? (
          // No-photo mode - show frame logging interface
          <View className="flex-1 items-center justify-center bg-black">
            <Camera size={48} color="#6B6B6B" />
            <Text className="text-text-inverse text-headline mt-lg mb-md">
              No Photo Mode
            </Text>
            <Text className="text-text-inverse text-body opacity-70 text-center px-xl">
              Use the barcode scanner or product search to log frames tried
            </Text>
          </View>
        ) : (
          // Camera mode - show live camera feed
          <CaptureView
            onCapture={handleCapture}
            maxPhotos={maxPhotos}
            currentCount={photos.length}
            disabled={photos.length >= maxPhotos}
            showMirrorToggle={true}
            onClose={handleExit}
          />
        )}
      </View>

      {/* Photo Shelf */}
      <View className="h-24 bg-bg-page border-t border-border px-lg py-sm">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {/* Photo Thumbnails */}
          {photos.map((photo) => (
            <ShelfThumbnail
              key={photo.id}
              photo={photo}
              isSelected={selectedPhotoIds.includes(photo.id)}
              onPress={() => handlePhotoPress(photo)}
              onToggleSelect={() => toggleSelectForCompare(photo.id)}
            />
          ))}

          {/* Compare Button */}
          {selectedPhotoIds.length >= 2 && (
            <View className="ml-lg">
              <Button
                variant="primary"
                onPress={() => setShowCompareView(true)}
              >
                Compare ({selectedPhotoIds.length})
              </Button>
            </View>
          )}

          {/* Hand to Client Button */}
          {photos.length > 0 && (
            <View className="ml-lg">
              <Button
                variant="secondary"
                onPress={handToClient}
              >
                <View className="flex-row items-center gap-xs">
                  <Hand size={16} color="white" />
                  <Text className="text-text-inverse text-bodyStrong">Hand to Client</Text>
                </View>
              </Button>
            </View>
          )}

          {/* Empty State */}
          {photos.length === 0 && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-text-muted text-body">
                {consentStatus === 'declined' 
                  ? 'No photo mode - use barcode to log frames'
                  : 'Photos will appear here after capture'
                }
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Consent Modal */}
      <ConsentModal
        isVisible={showConsentModal}
        clientName={activeClientName ?? 'Client'}
        onConsent={handleConsentResponse}
      />

      {/* Frame Detail Popover */}
      {selectedPhotoForDetail && (
        <FrameDetailPopover
          photo={selectedPhotoForDetail}
          visible={!!selectedPhotoForDetail}
          onClose={() => setSelectedPhotoForDetail(null)}
          onUpdatePhoto={handleUpdatePhoto}
          onDelete={handleDeletePhoto}
          onShortlist={handleShortlistPhoto}
          onRelink={handleRelinkPhoto}
        />
      )}
    </View>
  );
}