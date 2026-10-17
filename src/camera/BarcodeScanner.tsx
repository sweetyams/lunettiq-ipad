import { useRef } from 'react';
import { View, Text } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { ScanLine } from 'lucide-react-native';
import { Button } from '@/src/ui/kit/Button';
import { kitColors } from '@/src/ui/kit/colors';

interface BarcodeScannerProps {
  /** Raw code (QR or barcode). Debounced; ignored while `paused`. */
  onCode: (code: string) => void;
  paused?: boolean;
}

/** Camera that reads QR codes and barcodes and reports the raw value. Resolution is the caller's job. */
export function BarcodeScanner({ onCode, paused }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const last = useRef<{ code: string; at: number }>({ code: '', at: 0 });

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (paused || !data) return;
    const now = Date.now();
    if (data === last.current.code && now - last.current.at < 3000) return;
    last.current = { code: data, at: now };
    onCode(data.trim());
  };

  if (!permission) return <View className="flex-1 bg-chrome-bg" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-[12px] px-[32px] bg-bg-page">
        <ScanLine size={32} color={kitColors.iconMuted} />
        <Text className="text-heading-lg text-text-primary">Camera access needed</Text>
        <Text className="text-body-md text-text-tertiary text-center">To scan frame tags and shelf codes.</Text>
        <Button label="Allow camera" variant="primary" onPress={requestPermission} />
      </View>
    );
  }
  return (
    <View className="flex-1 bg-chrome-bg">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
        onBarcodeScanned={paused ? undefined : onScanned}
      />
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View className="w-[280px] h-[280px] rounded-lg border-2 border-bg-page opacity-80" />
      </View>
    </View>
  );
}
