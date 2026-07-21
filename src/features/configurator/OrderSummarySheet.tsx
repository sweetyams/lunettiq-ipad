/**
 * OrderSummarySheet — shown after configurator completes.
 *
 * Lets the SA review the configured product + pricing,
 * optionally link a prescription, and create an Rx pipeline order.
 */
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { X, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useCreateRxOrder } from '@/src/api/useRxPipeline';
import { usePrescriptions } from '@/src/api/usePrescriptions';
import { Button } from '@/src/ui/Button';
import { toast } from '@/src/ui/useToastStore';
import type { CartResult, ConfiguratorPriceSummary } from '@/src/api/configurator.types';

const CONFIG_LABELS: Record<string, string> = {
  _lensType: 'Lens Type',
  _lensIndex: 'Material',
  _coatings: 'Coatings',
  _sunTint: 'Tint',
  _polarized: 'Polarized',
  _mirrorCoating: 'Mirror',
  _rxStatus: 'Prescription',
};

function formatAttrValue(key: string, value: string): string | null {
  if (!value || value === 'false' || value === 'none') return null;
  if (key === '_coatings') return value.split(',').map((s) => s.trim()).join(', ');
  return value;
}

interface OrderSummarySheetProps {
  visible: boolean;
  productId: string;
  productName: string;
  variantId?: string;
  cartResult: CartResult;
  priceSummary: ConfiguratorPriceSummary;
  clientId?: string;
  sessionId?: string;
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
}

export function OrderSummarySheet({
  visible,
  productId,
  productName,
  variantId,
  cartResult,
  priceSummary,
  clientId,
  sessionId,
  onClose,
  onOrderCreated,
}: OrderSummarySheetProps) {
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [notes, setNotes] = useState('');

  const createOrder = useCreateRxOrder();
  const { data: prescriptions = [] } = usePrescriptions(
    clientId ? { clientId } : undefined
  );

  // Config attributes to display (filter internal ones)
  const displayAttrs = cartResult.attributes.filter(
    (a) => a.key.startsWith('_') && !a.key.endsWith('Price')
  );

  const handleCreateOrder = useCallback(async () => {
    if (!clientId) {
      toast.error('No client', 'Start a session to create an Rx order');
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        clientId,
        productId,
        prescriptionId: selectedPrescriptionId ?? undefined,
        notes: [
          notes.trim(),
          variantId ? `variantId:${variantId}` : null,
        ].filter(Boolean).join(' | ') || undefined,
        measurements: undefined,
      });

      toast.success('Order created', `Rx order for ${productName}`);
      onOrderCreated(order.id);
    } catch {
      toast.error('Failed to create order', 'Please try again');
    }
  }, [clientId, productId, variantId, selectedPrescriptionId, notes, createOrder, productName, onOrderCreated]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-bg-page">
        {/* Header */}
        <View className="flex-row items-center px-xl pt-xl pb-md border-b border-border">
          <View className="flex-1">
            <Text className="text-caption text-text-muted">Order summary</Text>
            <Text className="text-headline text-text-primary" numberOfLines={1}>
              {productName}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-[44px] h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={24} color="#2B2B2B" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-xl pt-lg" showsVerticalScrollIndicator={false}>
          {/* Lens configuration */}
          <View className="bg-bg-surface rounded-lg border border-border p-lg mb-lg">
            <Text className="text-headline text-text-primary mb-md">Lens configuration</Text>
            {displayAttrs.length > 0 ? (
              displayAttrs.map((attr) => {
                const label = CONFIG_LABELS[attr.key] ?? attr.key.replace(/^_/, '');
                const value = formatAttrValue(attr.key, attr.value);
                if (!value) return null;
                return (
                  <View key={attr.key} className="flex-row justify-between py-xs">
                    <Text className="text-body text-text-muted">{label}</Text>
                    <Text className="text-body text-text-primary capitalize">{value}</Text>
                  </View>
                );
              })
            ) : (
              <Text className="text-body text-text-muted">Standard configuration</Text>
            )}

            {/* Addon lines */}
            {cartResult.addonLines.length > 0 && (
              <View className="mt-md pt-md border-t border-border">
                <Text className="text-caption text-text-muted mb-xs">Add-ons</Text>
                {cartResult.addonLines.map((addon, i) => {
                  const label = addon.attributes.find((a) => a.key === '_addonLabel')?.value;
                  return (
                    <Text key={i} className="text-body text-text-primary">
                      {label ?? 'Add-on'}
                    </Text>
                  );
                })}
              </View>
            )}
          </View>

          {/* Prescription linking */}
          {clientId && (
            <View className="bg-bg-surface rounded-lg border border-border p-lg mb-lg">
              <Pressable
                onPress={() => setShowPrescriptions(!showPrescriptions)}
                className="flex-row items-center min-h-[44px]"
              >
                <FileText size={18} color="#2B2B2B" />
                <Text className="text-headline text-text-primary ml-sm flex-1">
                  {selectedPrescriptionId
                    ? `Rx linked`
                    : 'Link prescription (optional)'}
                </Text>
                {showPrescriptions ? (
                  <ChevronUp size={18} color="#6B6B6B" />
                ) : (
                  <ChevronDown size={18} color="#6B6B6B" />
                )}
              </Pressable>

              {showPrescriptions && (
                <View className="mt-md">
                  <Pressable
                    onPress={() => setSelectedPrescriptionId(null)}
                    className={`py-sm px-md rounded-md mb-sm min-h-[44px] justify-center ${
                      !selectedPrescriptionId ? 'bg-green/10 border border-green' : 'bg-bg-elevated'
                    }`}
                  >
                    <Text className="text-body text-text-primary">No prescription (sunglasses / plano)</Text>
                  </Pressable>
                  {prescriptions.map((rx) => (
                    <Pressable
                      key={rx.id}
                      onPress={() => setSelectedPrescriptionId(rx.id)}
                      className={`py-sm px-md rounded-md mb-sm min-h-[44px] justify-center ${
                        selectedPrescriptionId === rx.id
                          ? 'bg-green/10 border border-green'
                          : 'bg-bg-elevated'
                      }`}
                    >
                      <Text className="text-body text-text-primary">
                        {rx.type.replace('_', ' ')} — {rx.prescribedAt
                          ? new Date(rx.prescribedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'No date'}
                      </Text>
                      {rx.prescribedBy && (
                        <Text className="text-caption text-text-muted">{rx.prescribedBy}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Price breakdown */}
          <View className="bg-bg-surface rounded-lg border border-border p-lg mb-xl">
            <Text className="text-headline text-text-primary mb-md">Price</Text>
            {priceSummary.basePrice > 0 && (
              <View className="flex-row justify-between py-xs">
                <Text className="text-body text-text-muted">Frame</Text>
                <Text className="text-body text-text-primary">
                  ${(priceSummary.basePrice / 100).toFixed(2)}
                </Text>
              </View>
            )}
            {priceSummary.pricingLines.map((line) => (
              <View key={line.code} className="flex-row justify-between py-xs">
                <Text className="text-body text-text-muted">{line.label}</Text>
                <Text className="text-body text-text-primary">
                  +${(line.amount / 100).toFixed(2)}
                </Text>
              </View>
            ))}
            <View className="flex-row justify-between pt-md border-t border-border mt-sm">
              <Text className="text-headline text-text-primary">Total</Text>
              <Text className="text-headline text-text-primary">
                ${(priceSummary.total / 100).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Bottom padding */}
          <View className="h-28" />
        </ScrollView>

        {/* Action bar */}
        <View className="flex-row items-center px-xl py-md border-t border-border gap-md bg-bg-elevated">
          <View className="flex-1">
            {clientId ? (
              <Button
                variant="primary"
                onPress={handleCreateOrder}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? 'Creating order…' : 'Create Rx order'}
              </Button>
            ) : (
              <View className="items-center">
                <Text className="text-body text-text-muted">Start a session to create an order</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
