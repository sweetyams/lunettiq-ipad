/**
 * OrderSummarySheet — after the configurator: review lenses and price, link
 * a prescription, and create the Rx order (with the full configuration).
 */
import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { Check } from 'lucide-react-native';
import { useCreateRxOrder } from '@/src/api/useRxPipeline';
import { usePrescriptions } from '@/src/api/usePrescriptions';
import { Field, KeyValue, Section, Sheet, TextField, Badge, formatDate, kitColors } from '@/src/ui/kit';
import { rxStatus } from '@/src/features/client-profile/tabs/rxFormat';
import { toast } from '@/src/ui/useToastStore';
import type { CartResult, ConfiguratorPriceSummary } from '@/src/api/configurator.types';

const CONFIG_LABELS: Record<string, string> = {
  _lensType: 'Lens type',
  _lensIndex: 'Material',
  _coatings: 'Coatings',
  _sunTint: 'Tint',
  _polarized: 'Polarized',
  _mirrorCoating: 'Mirror',
  _rxStatus: 'Prescription',
};

function formatAttrValue(key: string, value: string): string | null {
  if (!value || value === 'false' || value === 'none') return null;
  if (value === 'true') return 'Yes';
  if (key === '_coatings') return value.split(',').map((s) => s.trim()).join(', ');
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

const money = (c: number) => `$${(c / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  visible, productId, productName, variantId, cartResult, priceSummary, clientId, sessionId, onClose, onOrderCreated,
}: OrderSummarySheetProps) {
  const [rxId, setRxId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const createOrder = useCreateRxOrder();
  const { data: prescriptions = [] } = usePrescriptions({ clientId }) // no client: nothing is fetched (never the store-wide list);

  const lensRows = cartResult.attributes
    .filter((a) => a.key.startsWith('_') && !a.key.endsWith('Price'))
    .map((a) => ({ label: CONFIG_LABELS[a.key] ?? a.key.replace(/^_/, ''), value: formatAttrValue(a.key, a.value) }))
    .filter((r) => r.value);
  const addons = cartResult.addonLines.map((l) => l.attributes.find((a) => a.key === '_addonLabel')?.value ?? 'Add-on');

  const create = async () => {
    if (!clientId) return;
    try {
      const order = await createOrder.mutateAsync({
        clientId, productId, productName, variantId, sessionId, prescriptionId: rxId, notes, cart: cartResult, price: priceSummary,
      });
      onOrderCreated(order.id);
    } catch {
      toast.error('Couldn’t create the order', 'Check the connection and try again. Nothing was lost.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title={`Order · ${productName}`}
      subtitle={clientId ? `Total ${money(priceSummary.total)}` : 'Start a visit to create an order.'}
      secondary={{ label: 'Back', onPress: onClose }}
      primary={{ label: 'Create order', onPress: create, disabled: !clientId, loading: createOrder.isPending }}
      footerNote={rxId ? 'Prescription linked' : clientId ? 'No prescription linked' : undefined}
    >
      <View className="flex-row gap-[20px] items-start">
        <View className="flex-1 gap-[16px]">
          <Section title="Lenses">
            {lensRows.length || addons.length ? (
              <KeyValue rows={[...lensRows.map((r) => ({ label: r.label, value: r.value })), ...addons.map((a, i) => ({ label: i ? '' : 'Add-ons', value: a }))]} />
            ) : (
              <Text className="text-body-md text-text-tertiary">Frame only, no lens options.</Text>
            )}
          </Section>
          <Section title="Price">
            <KeyValue mono rows={[
              ...(priceSummary.basePrice > 0 ? [{ label: 'Frame', value: money(priceSummary.basePrice) }] : []),
              ...priceSummary.pricingLines.map((l) => ({ label: l.label, value: `+${money(l.amount)}` })),
              { label: 'Total', value: <Text className="text-heading-lg text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{money(priceSummary.total)}</Text> },
            ]} />
          </Section>
        </View>
        <View className="flex-1 gap-[16px]">
          {clientId ? (
            <Field label="Prescription" hint={prescriptions.length ? 'Unverified prescriptions are checked by an optician before the lab.' : 'None on file. Add one on the client’s Clinical tab, or order without for sun / plano.'}>
              <View className="border border-border rounded-md overflow-hidden">
                {[{ id: null as string | null, title: 'No prescription', sub: 'Sunglasses or plano lenses', badge: null as null | ReturnType<typeof rxStatus> },
                  ...prescriptions.map((rx) => ({
                    id: rx.id as string | null,
                    title: rx.prescribedAt ? `Exam ${formatDate(rx.prescribedAt)}` : 'Prescription',
                    sub: [rx.prescribedBy, rx.clinicName].filter(Boolean).join(' · ') || 'Prescriber not recorded',
                    badge: rxStatus(rx),
                  }))].map((o, i) => {
                  const on = rxId === o.id;
                  return (
                    <Pressable key={o.id ?? 'none'} onPress={() => setRxId(o.id)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${o.title}, ${o.sub}`}>
                      {({ pressed }) => (
                        <View className={`flex-row items-center gap-[12px] px-[16px] min-h-[60px] py-[10px] ${i ? 'border-t border-border' : ''} ${on || pressed ? 'bg-bg-subtle' : ''}`}>
                          <View className={`w-[22px] h-[22px] rounded-full items-center justify-center ${on ? 'bg-accent' : 'border border-border'}`}>
                            {on ? <Check size={14} color={kitColors.inverse} strokeWidth={3} /> : null}
                          </View>
                          <View className="flex-1">
                            <Text className="text-body-md font-medium text-text-primary">{o.title}</Text>
                            <Text className="text-body-sm text-text-tertiary">{o.sub}</Text>
                          </View>
                          {o.badge ? <Badge tone={o.badge.tone}>{o.badge.label}</Badge> : null}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Field>
          ) : null}
          <TextField label="Notes for the lab" value={notes} onChangeText={setNotes} placeholder="e.g. Match the current pair’s segment height" multiline />
        </View>
      </View>
    </Sheet>
  );
}
