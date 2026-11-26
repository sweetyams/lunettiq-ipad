import { View, Text, Pressable, TextInput, ScrollView, FlatList } from 'react-native';
import { useVisitElapsed } from '@/src/features/session/elapsed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Image } from 'expo-image';
import { sizedImage } from '@/src/ui/imageUrl';
import { Camera, Check, Search, Smartphone, ChevronRight, ShoppingBag, MessageSquare, Presentation, Sparkles } from 'lucide-react-native';

import { useProducts } from '@/src/api/useProducts';
import { searchProducts } from '@/src/features/products/search';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useClient, useClientEnrichment, useClientPreferences } from '@/src/api/useClients';
import { useInsuranceProfile } from '@/src/api/useMultiPair';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import type { FrameTried } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Avatar } from '@/src/ui/Avatar';
import { ProductCard, gridColumns } from '@/src/ui/ProductCard';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { toast } from '@/src/ui/useToastStore';
import {
  Badge, Button, FilterChips, KeyValue, Section, StatusDot, TextField, VerdictPicker, kitColors,
} from '@/src/ui/kit';
import { EndSessionSheet } from '@/src/features/session/EndSessionSheet';
import { ConfiguratorSheet } from '@/src/features/configurator/ConfiguratorSheet';
import { OrderSummarySheet } from '@/src/features/configurator/OrderSummarySheet';
import type { CartResult, ConfiguratorPriceSummary } from '@/src/api/configurator.types';
import { productKey, type Product, type ProductListParams } from '@/src/api/products.types';
import { useLayout } from '@/src/ui/layout';
import { TraySheet, StyleFinderSheet, PresentationView, ContactCaptureSheet, SecondPairPrompt } from '@/src/features/visit/VisitExtras';
import { rankProducts, type StyleAnswers } from '@/src/features/visit/styleFinder';
import { isDraftClient } from '@/src/features/clients/QuickClientSheet';
import { MessageSheet } from '@/src/features/messages/MessageSheet';
import { joinFrames } from '@/src/features/messages/templates';
import { useLangStore } from '@/src/i18n';
import { VisitStepRail, StepFooter, WelcomeStep, FileStep, LifestyleStep, QuoteStep, CloseStep, useStepFacts } from '@/src/features/visit/VisitSteps';

type SortOption = 'best-match' | 'price-asc' | 'price-desc';

function HeaderIcon({ icon: Icon, label, onPress }: { icon: typeof Camera; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}
      className="w-[48px] h-[48px] rounded-md items-center justify-center active:bg-bg-subtle">
      <Icon size={22} color={kitColors.icon} />
    </Pressable>
  );
}

const titleOf = (p: Product) => (typeof p.title === 'string' ? p.title : p.title?.en ?? p.title?.fr ?? '');


export default function SessionWorkspaceScreen() {
  const layout = useLayout();
  // Catalogue beside the tray: square cards, 3–4 across in whatever width is left (tab bar floats at the bottom).
  const trayWidth = { wide: 400, regular: 340, compact: 300 }[layout.size];
  const catalogueColumns = gridColumns(layout.width - trayWidth - 48);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const handToClient = usePrivacyStore((s) => s.handToClient);
  const {
    mode, activeClientId, sessionId, sessionStartedAt, framesTried, sessionNotes,
    setSessionNotes, addFrameTried, updateFrameVerdict, startFitting, step,
  } = useSessionStore();

  const { data: client, isLoading: clientLoading, error: clientError, refetch: refetchClient } = useClient(id);
  const { data: enrichment } = useClientEnrichment(id);
  const { data: preferences } = useClientPreferences(id);
  const { data: insurance } = useInsuranceProfile(id);
  const elapsed = useVisitElapsed(sessionStartedAt);
  const facts = useStepFacts(id, client);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('best-match');
  // The whole catalogue (Frames loads the same, so it's one cached request); search runs on the
  // device because Foundry's products endpoint ignores `q`. It used to show only the first 50 frames.
  const queryParams: ProductListParams = { limit: 300, offset: 0 };
  const { data: productsResponse, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts(queryParams);
  const allProducts = productsResponse?.data ?? [];
  const products = useMemo(() => searchProducts(allProducts, search), [allProducts, search]);
  const { data: suggestions } = useSuggestions(id, { limit: 12 });

  const [showEnd, setShowEnd] = useState(false);
  const [panel, setPanel] = useState<null | 'tray' | 'style' | 'present' | 'contact' | 'message'>(null);
  const [style, setStyle] = useState<StyleAnswers>({});
  const lang = useLangStore((st) => st.uiLang);
  const fr = lang === 'fr';
  const styleActive = Object.values(style).some((v) => v && v !== 'any');
  // Order flow: configurator → summary, for one tray frame.
  const [ordering, setOrdering] = useState<{ product: Product; variantId?: string; cart?: CartResult; price?: ConfiguratorPriceSummary } | null>(null);

  const inTray = useMemo(() => new Set(framesTried.map((f) => f.productId)), [framesTried]);
  const suggested = useMemo(() => new Set((suggestions ?? []).map((s: { productId: string }) => s.productId)), [suggestions]);

  const sorted = useMemo(() => styleActive
    // Style finder answers: matches first (store rules, then keywords), the rest after.
    ? (() => { const ranked = rankProducts(products, style).map((r) => r.product); const set = new Set(ranked); return [...ranked, ...products.filter((p) => !set.has(p))]; })()
    : [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return parseFloat(a.priceMin ?? '0') - parseFloat(b.priceMin ?? '0');
    if (sortBy === 'price-desc') return parseFloat(b.priceMax ?? '0') - parseFloat(a.priceMax ?? '0');
    // While searching, keep the search's ranking; otherwise suggested frames first.
    if (search.trim()) return 0;
    return Number(suggested.has(productKey(b))) - Number(suggested.has(productKey(a)));
  }), [products, sortBy, suggested, style, styleActive, search]);

  const addToTray = useCallback((key: string) => {
    const product = allProducts.find((p) => productKey(p) === key || p.id === key);
    if (!product) return;
    if (inTray.has(productKey(product))) {
      toast.info('Already in the tray', titleOf(product));
      return;
    }
    addFrameTried({
      id: `${productKey(product)}-${Date.now()}`,
      productId: productKey(product),
      productName: titleOf(product),
      imageUrl: product.images[0]?.url,
      verdict: undefined,
      notes: '',
      photoIds: [],
      triedAt: Date.now(),
    });
  }, [allProducts, inTray, addFrameTried]);

  const startOrder = useCallback((frame: FrameTried) => {
    // The whole catalogue, not the search results: a tray frame can be ordered whatever was searched since.
    const product = allProducts.find((p) => productKey(p) === frame.productId);
    if (!product) {
      toast.info('Find the frame first', 'Search the catalogue for it, then order from the tray.');
      return;
    }
    setOrdering({ product, variantId: frame.variantId });
  }, [allProducts]);

  const fitRange = enrichment?.frameWidthMm && enrichment?.bridgeWidthMm
    ? `${Math.max(44, enrichment.frameWidthMm - 3)}–${enrichment.frameWidthMm + 3} □ ${enrichment.bridgeWidthMm - 2}–${enrichment.bridgeWidthMm + 2}`
    : null;
  const pairsLeft = insurance?.provider ? Math.max(0, insurance.pairsAllowed - insurance.pairsUsed) : null;

  if (mode === 'idle' || activeClientId !== id) {
    return (
      <View className="flex-1 bg-bg-page items-center justify-center gap-[12px]">
        <Text className="text-heading-lg text-text-primary">No visit in progress</Text>
        <Text className="text-body-md text-text-tertiary">Start a visit from Floor or the client’s profile.</Text>
        <Button label="Back to Floor" onPress={() => router.replace('/home')} />
      </View>
    );
  }
  if (clientLoading) return <LoadingState />;
  if (clientError) return <ErrorState error={clientError} onRetry={refetchClient} />;
  if (!client) return <EmptyState message="Client not found" />;

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'No name yet';
  const tier = (client.tags ?? []).find((t) => t.startsWith('member-'))?.replace('member-', '').toUpperCase();
  const loved = framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked').length;

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="flex-row flex-wrap items-center gap-x-[12px] gap-y-[8px] px-[32px] py-[16px] border-b border-border">
        <Pressable onPress={() => router.push(`/clients/${id}`)} accessibilityRole="button" accessibilityLabel={`Open ${name}'s profile`} className="flex-row items-center gap-[12px] flex-shrink">
          <Avatar firstName={client.firstName ?? ''} lastName={client.lastName ?? ''} size="md" />
          <View className="flex-shrink">
            <View className="flex-row items-center gap-[8px]">
              <Text className="text-heading-lg text-text-primary" numberOfLines={1}>{name}</Text>
              {tier ? <Badge tone="info">{tier}</Badge> : null}
            </View>
            <View className="flex-row items-center gap-[8px] mt-[2px]">
              <StatusDot tone="success" />
              <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>
                Visit · {elapsed} · {framesTried.length} tried{loved ? ` · ${loved} loved` : ''}
              </Text>
            </View>
          </View>
        </Pressable>
        <View className="flex-1" />
        <Button label={`${fr ? 'Plateau' : 'Tray'}${framesTried.length ? ` · ${framesTried.length}` : ''}`} icon={ShoppingBag} onPress={() => setPanel('tray')} />
        {/* Secondary visit actions as icons so the header fits portrait 11" on one line. */}
        <View className="flex-row items-center">
          <HeaderIcon icon={Presentation} label={fr ? 'Montrer au client' : 'Show client'} onPress={() => setPanel('present')} />
          <HeaderIcon icon={MessageSquare} label={fr ? 'Message au client' : 'Message the client'} onPress={() => setPanel(isDraftClient(client) ? 'contact' : 'message')} />
          <HeaderIcon icon={Camera} label={fr ? 'Photos d’essayage' : 'Fitting photos'} onPress={() => { startFitting(); router.push(`/clients/${id}/fitting`); }} />
          <HeaderIcon icon={Smartphone} label={fr ? 'Remettre au client' : 'Hand to client'} onPress={handToClient} />
        </View>
        <Button label={fr ? 'Terminer' : 'End visit'} variant="primary" onPress={() => setShowEnd(true)} />
      </View>

      <VisitStepRail facts={facts} />
      {isDraftClient(client) ? (
        <View className="flex-row items-center gap-[12px] px-[32px] py-[10px] border-b border-border bg-bg-subtle">
          <Text className="flex-1 text-body-md text-text-secondary">{fr ? 'Visite sans nom : tout ce qu’ils essaient est gardé. Prenez leurs coordonnées quand ils sont prêts.' : 'Guest visit: everything they try is kept. Take their details when they’re ready.'}</Text>
          <Button label={fr ? 'Leur envoyer leur sélection' : 'Send them their choices'} size="sm" variant="primary" onPress={() => setPanel('contact')} />
        </View>
      ) : null}
      {step === 'frames' ? (
        <View className="flex-1 flex-row">
          {/* Catalogue */}
          <View className="flex-1 px-[24px] pt-[20px]">
            <View className="flex-row items-center gap-[10px] border border-border rounded-md px-[12px] min-h-[44px] bg-bg-page">
              <Search size={18} color={kitColors.iconMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search frames by name, shape or colour"
                placeholderTextColor={kitColors.iconMuted}
                className="flex-1 text-body-md text-text-primary"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search frames"
              />
            </View>
            <View className="flex-row items-center gap-[12px] mt-[12px]">
              <View className="flex-shrink">
                <FilterChips<SortOption>
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { key: 'best-match', label: 'Best match' },
                    { key: 'price-asc', label: 'Price: low to high' },
                    { key: 'price-desc', label: 'Price: high to low' },
                  ]}
                />
              </View>
              <View className="flex-1" />
              {fitRange ? <Badge tone="info">{`Fits ${fitRange}`}</Badge> : null}
              <Button label={styleActive ? (fr ? 'Style ✓' : 'Style ✓') : (fr ? 'Trouver leur style' : 'Find their style')} icon={Sparkles} size="sm" variant={styleActive ? 'primary' : 'secondary'} onPress={() => setPanel('style')} />
            </View>

            {productsLoading ? (
              <LoadingState />
            ) : productsError ? (
              <ErrorState error={productsError} onRetry={refetchProducts} />
            ) : (
              <FlatList
                data={sorted}
                keyExtractor={(item) => productKey(item)}
                key={`tray-grid-${catalogueColumns}`}
                numColumns={catalogueColumns}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingTop: 12, paddingBottom: 140 }}
                ListHeaderComponent={
                  <Text className="text-body-sm text-text-tertiary px-[4px] pb-[8px]">
                    {sorted.length} frames · tap to add to the tray
                  </Text>
                }
                ListEmptyComponent={<EmptyState message={search ? `No frames match “${search}”.` : 'No frames in the catalogue.'} />}
                renderItem={({ item }) => {
                  const added = inTray.has(productKey(item));
                  return (
                    <View className="flex-1 m-[6px]" style={{ maxWidth: `${100 / catalogueColumns}%` }}>
                      <ProductCard product={item} onPress={addToTray} />
                      {added ? (
                        <View className="absolute top-[8px] left-[8px] flex-row items-center gap-[4px] bg-accent rounded-full px-[8px] py-[2px]" pointerEvents="none">
                          <Check size={12} color={kitColors.inverse} strokeWidth={2.5} />
                          <Text className="text-body-sm font-medium text-accent-text">In tray</Text>
                        </View>
                      ) : suggested.has(productKey(item)) ? (
                        <View className="absolute top-[8px] left-[8px]" pointerEvents="none"><Badge tone="info">Suggested</Badge></View>
                      ) : null}
                    </View>
                  );
                }}
              />
            )}
          </View>

          {/* Visit rail */}
          <ScrollView
            className="flex-grow-0 border-l border-border" style={{ width: trayWidth }}
            contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <SecondPairPrompt />
            <Section title="Tray" count={framesTried.length || undefined} padded={framesTried.length === 0} action={framesTried.length ? { label: fr ? 'Revoir' : 'Review', onPress: () => setPanel('tray') } : undefined}>
              {framesTried.length === 0 ? (
                <Text className="text-body-sm text-text-tertiary">Tap frames in the catalogue as they try them on. Record a reaction for each; it drives follow-ups.</Text>
              ) : (
                framesTried.slice().reverse().map((frame, i) => {
                  const isLoved = frame.verdict === 'loved' || frame.verdict === 'liked';
                  return (
                    <View key={frame.id} className={`px-[16px] py-[12px] gap-[10px] ${i > 0 ? 'border-t border-border' : ''}`}>
                      <View className="flex-row items-center gap-[12px]">
                        <View className="w-[56px] h-[40px] rounded-sm border border-border overflow-hidden items-center justify-center">
                          {frame.imageUrl ? <Image source={{ uri: sizedImage(frame.imageUrl, 256) }} contentFit="cover" style={{ width: '100%', height: '100%' }} /> : null}
                        </View>
                        <Text className="flex-1 text-body-md font-medium text-text-primary" numberOfLines={2}>{frame.productName}</Text>
                        {isLoved ? <Button label="Order" size="sm" onPress={() => startOrder(frame)} /> : null}
                      </View>
                      <VerdictPicker value={frame.verdict} onChange={(v) => updateFrameVerdict(frame.id, v)} label={frame.productName} />
                    </View>
                  );
                })
              )}
            </Section>

            <Section title="Client" action={{ label: 'Profile', onPress: () => router.push(`/clients/${id}`) }}>
              <KeyValue
                rows={[
                  { label: 'Fit', value: fitRange },
                  { label: 'Likes', value: preferences?.stated?.shapes?.length ? preferences.stated.shapes.join(', ') : null },
                  { label: 'Avoid', value: preferences?.stated?.avoid?.length ? <Text className="text-body-md text-error flex-shrink text-right" numberOfLines={1}>{preferences.stated.avoid.join(', ')}</Text> : null },
                  { label: 'Insurance', value: pairsLeft == null ? null : `${pairsLeft} ${pairsLeft === 1 ? 'pair' : 'pairs'} left` },
                  { label: 'Orders', value: String(client.orderCount ?? 0) },
                ]}
              />
            </Section>

            <Section title="Visit notes">
              <TextField label="Notes" hint="Saved to their history when the visit ends." value={sessionNotes} onChangeText={setSessionNotes} placeholder="What they’re after, budget, who it’s for" multiline />
            </Section>

            <Pressable onPress={() => router.push(`/clients/${id}`)} className="flex-row items-center justify-center gap-[4px] min-h-[44px]" accessibilityRole="button">
              <Text className="text-body-sm text-text-tertiary">Prescription, history and more on the profile</Text>
              <ChevronRight size={16} color={kitColors.iconMuted} />
            </Pressable>
          </ScrollView>
        </View>
      ) : step === 'welcome' ? <WelcomeStep client={client} />
        : step === 'file' ? <FileStep client={client} />
        : step === 'lifestyle' ? <LifestyleStep client={client} done={facts.hasLifestyle} />
        : step === 'quote' ? <QuoteStep onOrder={startOrder} />
        : <CloseStep client={client} minutes={Math.max(1, Math.round((Date.now() - (sessionStartedAt ?? Date.now())) / 60_000))} onEnd={() => setShowEnd(true)} />}
      <StepFooter onEnd={() => setShowEnd(true)} />

      {ordering && !ordering.cart ? (
        <ConfiguratorSheet
          visible
          productId={ordering.product.id ?? ordering.product.shopifyId}
          productName={titleOf(ordering.product)}
          basePrice={ordering.product.priceMin ? Math.round(Number(ordering.product.priceMin) * 100) : 0}
          onClose={() => setOrdering(null)}
          onComplete={(cart, price) => setOrdering((o) => (o ? { ...o, cart, price } : o))}
        />
      ) : null}
      {ordering?.cart && ordering.price ? (
        <OrderSummarySheet
          visible
          productId={ordering.product.id ?? ordering.product.shopifyId}
          productName={titleOf(ordering.product)}
          variantId={ordering.variantId}
          cartResult={ordering.cart}
          priceSummary={ordering.price}
          clientId={id}
          sessionId={sessionId ?? undefined}
          onClose={() => setOrdering(null)}
          onOrderCreated={() => {
            setOrdering(null);
            toast.success('Order created', 'It’s in Orders. End the visit as “Purchased” when you’re done.');
          }}
        />
      ) : null}

      {panel === 'tray' ? <TraySheet visible clientId={id} onClose={() => setPanel(null)} onOrder={startOrder} /> : null}
      {panel === 'style' ? <StyleFinderSheet visible initial={style} onApply={setStyle} onClose={() => setPanel(null)} /> : null}
      <PresentationView visible={panel === 'present'} onClose={() => setPanel(null)} clientFirstName={isDraftClient(client) ? null : client.firstName} />
      {panel === 'contact' ? <ContactCaptureSheet visible clientId={id} onClose={() => setPanel(null)} /> : null}
      {panel === 'message' ? (
        <MessageSheet visible onClose={() => setPanel(null)}
          recipient={{ firstName: client.firstName, phone: client.phone, email: client.email }}
          templates={['visit_choices', 'shortlist', 'booked_visit']}
          vars={{ frames: joinFrames(framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked').map((f) => f.productName), lang) || null }} />
      ) : null}

      <EndSessionSheet
        visible={showEnd}
        onDismiss={() => setShowEnd(false)}
        onComplete={() => { setShowEnd(false); router.replace('/home'); }}
      />
    </View>
  );
}
