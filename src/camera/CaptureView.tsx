import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Camera, CameraOff, RotateCcw, Image as ImageIcon } from 'lucide-react-native';

interface CaptureViewProps {
  onCapture: (photo: CameraCapturedPicture & { burst?: CameraCapturedPicture[] }) => void;
  maxPhotos?: number;
  currentCount?: number;
  disabled?: boolean;
  showMirrorToggle?: boolean;
  onClose?: () => void;
}

export function CaptureView({
  onCapture,
  maxPhotos = 20,
  currentCount = 0,
  disabled = false,
  showMirrorToggle = true,
  onClose,
}: CaptureViewProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  
  // Animated values for guide overlay
  const guideOpacity = useRef(new Animated.Value(0.3)).current;
  const captureButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide guide overlay during capture
    if (isCapturing) {
      setShowGuide(false);
      // Show guide again after capture completes
      const timer = setTimeout(() => setShowGuide(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isCapturing]);

  const handlePermissionRequest = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      // Handle permission denied
      console.warn('Camera permission denied');
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing || disabled || currentCount >= maxPhotos) {
      return;
    }

    try {
      setIsCapturing(true);
      
      // Animate capture button
      Animated.sequence([
        Animated.timing(captureButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(captureButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Burst mode: capture 3 frames rapidly
      const burstPhotos: CameraCapturedPicture[] = [];
      
      for (let i = 0; i < 3; i++) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false, // Skip EXIF for performance
        });
        
        if (photo) {
          burstPhotos.push(photo);
        }
        
        // Small delay between burst shots
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (burstPhotos.length > 0) {
        // Pick the sharpest photo (use middle frame as heuristic)
        const primaryPhoto = burstPhotos[Math.floor(burstPhotos.length / 2)];
        
        if (primaryPhoto) {
          // Call onCapture with primary photo
          onCapture(primaryPhoto);
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Show permission request if not granted
  if (!permission) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-text-inverse text-body mb-lg">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-xl">
        <CameraOff size={48} color="white" className="mb-lg" />
        <Text className="text-text-inverse text-headline text-center mb-md">
          Camera Permission Required
        </Text>
        <Text className="text-text-inverse text-body text-center mb-lg opacity-80">
          This app needs camera access to capture fitting photos
        </Text>
        <Pressable
          onPress={handlePermissionRequest}
          className="bg-accent rounded-md px-lg py-sm"
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
        >
          <Text className="text-text-inverse text-bodyStrong">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const isAtPhotoLimit = currentCount >= maxPhotos;

  return (
    <View className="flex-1 bg-black">
      {/* Camera viewfinder */}
      <CameraView
        ref={cameraRef}
        facing={facing}
        className="flex-1"
      />
      
      {/* Face guide overlay */}
      {showGuide && (
        <Animated.View
          className="absolute inset-0 justify-center items-center pointer-events-none"
          style={{ opacity: guideOpacity }}
        >
          <View className="w-80 h-96 border-2 border-white rounded-full opacity-30" />
        </Animated.View>
      )}

      {/* Top bar */}
      <View className="absolute top-0 left-0 right-0 pt-12 pb-4 px-6 bg-black/30">
        <View className="flex-row justify-between items-center">
          {/* Close button */}
          {onClose && (
            <Pressable
              onPress={onClose}
              className="w-11 h-11 justify-center items-center"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close camera"
            >
              <Text className="text-text-inverse text-headline">✕</Text>
            </Pressable>
          )}
          
          {/* Photo count */}
          <View className="bg-black/50 rounded-full px-3 py-1">
            <Text className="text-text-inverse text-caption">
              {currentCount}/{maxPhotos}
            </Text>
          </View>
          
          {/* Mirror toggle */}
          {showMirrorToggle && (
            <Pressable
              onPress={toggleFacing}
              className="w-11 h-11 justify-center items-center"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Switch camera"
            >
              <RotateCcw size={24} color="white" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Bottom controls */}
      <View className="absolute bottom-0 left-0 right-0 pb-12 px-6">
        <View className="flex-row justify-end items-center">
          {/* Capture button */}
          <Animated.View style={{ transform: [{ scale: captureButtonScale }] }}>
            <Pressable
              onPress={handleCapture}
              disabled={isCapturing || disabled || isAtPhotoLimit}
              className={`w-18 h-18 rounded-full border-4 justify-center items-center ${
                isAtPhotoLimit || disabled
                  ? 'border-border bg-border/30'
                  : isCapturing
                  ? 'border-accent bg-accent/30'
                  : 'border-white bg-bg-elevated/20'
              }`}
              style={{ minWidth: 72, minHeight: 72 }} // Ensure 72pt touch target
              accessibilityRole="button"
              accessibilityLabel={
                isAtPhotoLimit 
                  ? "Photo limit reached" 
                  : isCapturing 
                  ? "Capturing photo" 
                  : "Capture photo"
              }
            >
              <View className={`w-12 h-12 rounded-full ${
                isAtPhotoLimit || disabled
                  ? 'bg-border'
                  : isCapturing
                  ? 'bg-accent'
                  : 'bg-bg-elevated'
              }`} />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Photo limit warning */}
      {isAtPhotoLimit && (
        <View className="absolute bottom-32 left-0 right-0 px-6">
          <View className="bg-warning/90 rounded-lg p-4">
            <Text className="text-text-inverse text-bodyStrong text-center">
              Photo limit reached ({maxPhotos})
            </Text>
          </View>
        </View>
      )}

      {/* Capturing indicator */}
      {isCapturing && (
        <View className="absolute inset-0 justify-center items-center bg-black/20 pointer-events-none">
          <View className="bg-bg-elevated/90 rounded-lg px-6 py-4">
            <Text className="text-text-primary text-bodyStrong">Capturing...</Text>
          </View>
        </View>
      )}
    </View>
  );
}