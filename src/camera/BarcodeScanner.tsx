import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { X, ScanLine, Package } from 'lucide-react-native';
import { api } from '@/src/api/client';

interface Product {
  id: string;
  name: string;
  familyName?: string;
  collection?: string;
  sku?: string;
}

interface BarcodeScannerProps {
  onScan: (product: Product) => void;
  onClose: () => void;
  onError?: (error: string) => void;
}

export function BarcodeScanner({ onScan, onClose, onError }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  
  // Animated reticle
  const reticleScale = useRef(new Animated.Value(1)).current;
  const reticleOpacity = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    // Animate the scanning reticle
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(reticleScale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(reticleOpacity, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(reticleScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(reticleOpacity, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    if (isScanning && !isResolving) {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
    }

    return () => pulseAnimation.stop();
  }, [isScanning, isResolving, reticleScale, reticleOpacity]);

  const handlePermissionRequest = async () => {
    const result = await requestPermission();
    if (!result.granted && onError) {
      onError('Camera permission is required for barcode scanning');
    }
  };

  const resolveBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      setIsResolving(true);
      
      // Call Foundry API to resolve barcode to product
      const response = await api.post<Product>('/api/inventory/scan/resolve', {
        barcode,
        scanContext: 'fitting',
      });
      
      return response;
    } catch (error) {
      console.error('Error resolving barcode:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to identify product';
      if (onError) {
        onError(errorMessage);
      }
      
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  const handleBarcodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    const now = Date.now();
    
    // Debounce scanning to prevent multiple rapid scans
    if (now - lastScanTime < 2000) {
      return;
    }
    
    setLastScanTime(now);
    setIsScanning(false);
    
    console.log('Barcode scanned:', { type, data });
    
    // Resolve the barcode to a product
    const product = await resolveBarcode(data);
    
    if (product) {
      setScannedProduct(product);
      // Auto-confirm after showing product for 1.5 seconds
      setTimeout(() => {
        onScan(product);
      }, 1500);
    } else {
      // Re-enable scanning on error
      setIsScanning(true);
    }
  };

  const handleManualConfirm = () => {
    if (scannedProduct) {
      onScan(scannedProduct);
    }
  };

  const handleRescan = () => {
    setScannedProduct(null);
    setIsScanning(true);
    setLastScanTime(0);
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
        <ScanLine size={48} color="white" className="mb-lg" />
        <Text className="text-text-inverse text-headline text-center mb-md">
          Camera Permission Required
        </Text>
        <Text className="text-text-inverse text-body text-center mb-lg opacity-80">
          This app needs camera access to scan barcodes
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

  return (
    <View className="flex-1 bg-black">
      {/* Camera view */}
      <CameraView
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        className="flex-1"
      />

      {/* Top bar */}
      <View className="absolute top-0 left-0 right-0 pt-12 pb-4 px-6 bg-black/50">
        <View className="flex-row justify-between items-center">
          <Pressable
            onPress={onClose}
            className="w-11 h-11 justify-center items-center"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancel scan"
          >
            <X size={24} color="white" />
          </Pressable>
          
          <Text className="text-text-inverse text-bodyStrong">Scan Product Barcode</Text>
          
          <View className="w-11" />
        </View>
      </View>

      {/* Scanning reticle */}
      {isScanning && !isResolving && (
        <View className="absolute inset-0 justify-center items-center pointer-events-none">
          <Animated.View
            style={{
              transform: [{ scale: reticleScale }],
              opacity: reticleOpacity,
            }}
            className="w-64 h-64 border-2 border-accent rounded-lg"
          >
            {/* Corner markers */}
            <View className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-accent rounded-tl-lg" />
            <View className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-accent rounded-tr-lg" />
            <View className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-accent rounded-bl-lg" />
            <View className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-accent rounded-br-lg" />
            
            {/* Center crosshair */}
            <View className="absolute inset-0 justify-center items-center">
              <View className="w-8 h-0.5 bg-accent" />
              <View className="w-0.5 h-8 bg-accent absolute" />
            </View>
          </Animated.View>
        </View>
      )}

      {/* Bottom instructions */}
      <View className="absolute bottom-0 left-0 right-0 pb-12 px-6">
        {isScanning && !isResolving && !scannedProduct && (
          <View className="bg-black/70 rounded-lg p-4">
            <Text className="text-text-inverse text-body text-center">
              Position the barcode within the frame
            </Text>
            <Text className="text-text-inverse text-caption text-center mt-2 opacity-80">
              The camera will scan automatically
            </Text>
          </View>
        )}

        {isResolving && (
          <View className="bg-black/70 rounded-lg p-4">
            <Text className="text-text-inverse text-bodyStrong text-center">
              Identifying product...
            </Text>
          </View>
        )}

        {scannedProduct && (
          <View className="bg-accent/90 rounded-lg p-4">
            <View className="flex-row items-center justify-center mb-2">
              <Package size={20} color="white" className="mr-2" />
              <Text className="text-text-inverse text-bodyStrong">Product Found</Text>
            </View>
            
            <Text className="text-text-inverse text-headline text-center mb-1">
              {scannedProduct.familyName || scannedProduct.name}
            </Text>
            
            {scannedProduct.collection && (
              <Text className="text-text-inverse text-body text-center opacity-90">
                {scannedProduct.collection}
              </Text>
            )}
            
            {scannedProduct.sku && (
              <Text className="text-text-inverse text-caption text-center mt-1 opacity-80">
                SKU: {scannedProduct.sku}
              </Text>
            )}
            
            <View className="flex-row justify-center mt-4 space-x-4">
              <Pressable
                onPress={handleRescan}
                className="bg-bg-elevated/20 rounded-md px-4 py-2"
                accessibilityRole="button"
                accessibilityLabel="Scan again"
              >
                <Text className="text-text-inverse text-bodyStrong">Rescan</Text>
              </Pressable>
              
              <Pressable
                onPress={handleManualConfirm}
                className="bg-bg-elevated rounded-md px-6 py-2"
                accessibilityRole="button"
                accessibilityLabel="Confirm product selection"
              >
                <Text className="text-accent text-bodyStrong">Confirm</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}