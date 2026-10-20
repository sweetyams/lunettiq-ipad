import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { BarcodeScanner } from '@/src/camera/BarcodeScanner';
import { api, APIError } from '@/src/api/client';
import { resolveScanCode, catalogueQuery, type ScanResult } from '@/src/api/scanResolve';
import { productKey, type Product } from '@/src/api/products.types';
import { Badge, Button, KeyValue, Section, TextField, kitColors } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import { useLayout } from '@/src/ui/layout';

/** Scan a frame tag or shelf code: stock by location, shelf, and a jump to the frame. */
export default function ScannerScreen() {
  const layout = useLayout();
  const router = useRouter();
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const resolve = async (code: string) => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      setResult(await resolveScanCode(code.trim()));
    } catch (e) {
      setResult(null);
      setProblem(e instanceof APIError && e.status === 404 ? `“${code.trim()}” isn’t a known frame tag or shelf code.` : 'Couldn’t look that up. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const openFrame = async (q: string) => {
    setOpening(true);
    try {
      const res = await api.get<{ data?: Product[] } | Product[]>('/api/storefront/products', { params: { q, limit: '1' } });
      const first = Array.isArray(res) ? res[0] : res?.data?.[0];
      if (first) router.push(`/products/${productKey(first)}`);
      else toast.info('Not in the catalogue', `No frame matches “${q}”.`);
    } catch {
      toast.error('Couldn’t search the catalogue', 'Check the connection and try again.');
    } finally {
      setOpening(false);
    }
  };

  const item = result?.type === 'item' ? result.item : null;
  const onHand = item?.locationLevels.reduce((n, l) => n + l.onHand, 0) ?? 0;

  return (
    <View className="flex-1 bg-bg-page">
      <View className="flex-row items-center gap-[12px] px-[32px] py-[12px] border-b border-border">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-[4px] min-h-[44px] -ml-[6px]" accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={20} color={kitColors.textTertiary} />
          <Text className="text-body-md text-text-tertiary">Frames</Text>
        </Pressable>
        <Text className="text-heading-lg text-text-primary ml-[8px]">Scan</Text>
      </View>
      <View className="flex-1 flex-row">
        <View className="flex-1">
          <BarcodeScanner onCode={resolve} paused={busy} />
        </View>
        <ScrollView className="flex-grow-0 border-l border-border" style={{ width: { wide: 440, regular: 360, compact: 320 }[layout.size] }} contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-end gap-[8px]">
            <TextField className="flex-1" label="Or type the code" value={manual} onChangeText={setManual} placeholder="IT-… or SL-…" autoCapitalize="characters" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => resolve(manual)} />
            <Button label="Find" variant="primary" onPress={() => resolve(manual)} loading={busy} disabled={!manual.trim()} />
          </View>

          {problem ? <Text className="text-body-md text-error">{problem}</Text> : null}
          {!result && !problem ? (
            <Text className="text-body-md text-text-tertiary">Point the camera at a frame tag or shelf label. Stock and location show here.</Text>
          ) : null}

          {item ? (
            <>
              <View className="gap-[6px]">
                <Text className="text-display-sm text-text-primary">{item.familyName ?? item.name}</Text>
                <View className="flex-row items-center gap-[8px] flex-wrap">
                  {item.colour ? <Text className="text-body-md text-text-secondary">{item.colour}</Text> : null}
                  <Badge tone={onHand > 0 ? 'success' : 'danger'} dot>{onHand > 0 ? `${onHand} on hand` : 'None on hand'}</Badge>
                </View>
              </View>
              <Button label="Open frame" variant="primary" onPress={() => openFrame(catalogueQuery(item))} loading={opening} />
              <Section title="Details">
                <KeyValue rows={[
                  { label: 'SKU', value: item.sku },
                  { label: 'Shelf', value: item.shelf ? `${item.shelf.label ?? item.shelf.code} · ${item.shelf.locationName}` : null },
                  { label: 'Tag', value: item.qrCode },
                ]} />
              </Section>
              {item.locationLevels.length ? (
                <Section title="Stock by store">
                  <KeyValue mono rows={item.locationLevels.map((l) => ({ label: l.locationName, value: `${l.onHand} on hand${l.committed ? ` · ${l.committed} held` : ''}` }))} />
                </Section>
              ) : null}
            </>
          ) : null}

          {result?.type === 'shelf' ? (
            <Section title={`Shelf ${result.shelf.label ?? result.shelf.code}`} count={result.items.length} padded={result.items.length === 0}>
              {result.items.length === 0 ? (
                <Text className="text-body-sm text-text-tertiary">Nothing assigned to this shelf.</Text>
              ) : result.items.map((it, i) => (
                <Pressable key={it.id} onPress={() => openFrame(it.name)} accessibilityRole="button">
                  {({ pressed }) => (
                    <View className={`flex-row items-center justify-between px-[20px] min-h-[52px] ${i ? 'border-t border-border' : ''} ${pressed ? 'bg-bg-subtle' : ''}`}>
                      <Text className="text-body-md text-text-primary flex-1" numberOfLines={1}>{it.name}</Text>
                      <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>{it.onHand} on hand</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </Section>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}
