import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Hand } from 'lucide-react-native';
import { useFittingStore } from '@/src/features/fitting/useFittingStore';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { ConsentModal } from '@/src/features/fitting/ConsentModal';
import { ShelfThumbnail } from '@/src/features/fitting/ShelfThumbnail';
import { CompareView } from '@/src/features/fitting/CompareView';
import { FrameDetailPopover } from '@/src/features/fitting/FrameDetailPopover';
import { HandedToClientView } from '@/src/features/fitting/HandedToClientView';
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

  const handleCapture = () => {
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

    // Create mock photo for now (real camera integration later)
    const mockPhoto: SessionPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      localUri: `mock://photo_${photos.length + 1}`,
      thumbnailUri: `mock://thumb_${photos.length + 1}`,
      r2Key: null,
      productId: null,
      productName: null,
      verdict: null,
      notes: '',
      clientVisible: true,
      capturedAt: Date.now(),
      uploadStatus: 'pending',
    };

    addPhoto(mockPhoto);
  };

  const handleConsentResponse = (granted: boolean) => {
    setConsent(granted);
    if (granted) {
      // Proceed with first capture
      handleCapture();
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
  const isCapturing = false; // Will be true during actual camera capture

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
      <View className="flex-1 items-center justify-center relative">
        {/* Placeholder for camera feed */}
        <View className="flex-1 w-full bg-black items-center justify-center">
          <Camera size={48} color="#6B6B6B" />
          <Text className="text-text-inverse text-body mt-md opacity-70">
            Camera feed placeholder
          </Text>
          
          {/* Face guide overlay */}
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-64 h-80 border-2 border-dashed border-white/30 rounded-full" />
          </View>
        </View>

        {/* Capture Button */}
        <Pressable
          onPress={handleCapture}
          disabled={isCapturing || (consentStatus === 'declined' ? false : photos.length >= maxPhotos)}
          className={`
            absolute right-8 w-18 h-18 rounded-full bg-bg-elevated border-4 border-white/30 items-center justify-center
            ${isCapturing || photos.length >= maxPhotos ? 'opacity-50' : ''}
          `}
          style={{ 
            top: '50%', 
            marginTop: -36, // Half of height (72px / 2)
            minWidth: 72,
            minHeight: 72,
          }}
          accessibilityRole="button"
          accessibilityLabel="Capture photo"
        >
          <View className="w-16 h-16 rounded-full bg-bg-elevated border-2 border-gray-300" />
        </Pressable>
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