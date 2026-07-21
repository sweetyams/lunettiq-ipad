import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import { BarcodeScanner } from '@/src/camera/BarcodeScanner';
import { api } from '@/src/api/client';
import { Button } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';

interface Product {
  id: string;
  name: string;
  familyName?: string;
  collection?: string;
  sku?: string;
}

export default function ScannerScreen() {
  const router = useRouter();
  const [manualBarcode, setManualBarcode] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleScan = async (product: Product) => {
    // Product already resolved by BarcodeScanner component
    router.replace(`/products/${product.id}`);
  };

  const handleScanError = (error: string) => {
    toast.error('Scan Error', error);
  };

  const handleClose = () => {
    router.back();
  };

  const handleManualSearch = async () => {
    if (!manualBarcode.trim()) return;

    setIsResolving(true);
    try {
      // Look up product by barcode/SKU
      const product = await api.get<Product>(`/api/products/by-barcode/${encodeURIComponent(manualBarcode.trim())}`);
      router.replace(`/products/${product.id}`);
    } catch (error) {
      toast.error('Product Not Found', 'No product found with that barcode or SKU.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-lg py-lg bg-black/50 absolute top-0 left-0 right-0 z-10" style={{ paddingTop: 60 }}>
        <Pressable 
          onPress={handleClose}
          className="flex-row items-center min-w-[44px] min-h-[44px] justify-center"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-headline font-semibold text-text-inverse text-center flex-1">
          Scan Barcode
        </Text>
        <View className="w-[44px]" />
      </View>

      {/* Scanner */}
      <BarcodeScanner 
        onScan={handleScan}
        onClose={handleClose}
        onError={handleScanError}
      />

      {/* Manual entry */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/80 px-xl py-lg" style={{ paddingBottom: 60 }}>
        <Text className="text-bodyStrong font-medium text-text-inverse mb-sm text-center">
          Or enter manually
        </Text>
        <View className="flex-row items-center space-x-sm">
          <View className="flex-1 flex-row items-center bg-bg-elevated rounded-md px-md border border-border">
            <Search size={18} color="#6B6B6B" />
            <TextInput
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Enter barcode or SKU"
              placeholderTextColor="#6B6B6B"
              className="flex-1 ml-sm text-body text-text-primary py-sm min-h-[44px]"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleManualSearch}
              accessibilityLabel="Barcode or SKU"
            />
          </View>
          <Button
            variant="primary"
            onPress={handleManualSearch}
            loading={isResolving}
            disabled={!manualBarcode.trim()}
            className="min-w-[80px]"
          >
            Find
          </Button>
        </View>
      </View>
    </View>
  );
}