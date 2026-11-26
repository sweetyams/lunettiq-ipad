import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useProductFamily } from '@/src/api/useProductFamily';
import type { ProductSibling } from '@/src/api/families.types';

interface ColourSiblingsProps {
  productId: string;
  currentHandle?: string;
  /** The frame's own type, used until the family loads. */
  type?: 'optical' | 'sun' | null;
}

// --- Type Toggle Button ---

interface TypeButtonProps {
  label: string;
  active: boolean;
  onPress?: () => void;
}

function TypeButton({ label, active, onPress }: TypeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={active}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}${active ? ', selected' : ''}`}
      className={`min-h-[44px] px-lg py-sm items-center justify-center ${
        active ? 'bg-accent' : 'bg-bg-page'
      }`}
    >
      <Text
        className={`text-body-md font-medium ${
          active ? 'text-accent-text' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// --- Swatch ---

/** The colour as lunettiq.com paints it: its swatch image, two tones split down the middle, or one colour. */
export function FrameSwatch({ sibling, size = 18 }: { sibling: Pick<ProductSibling, 'colourHex' | 'colourHex2' | 'swatchImage' | 'swatchType'>; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (sibling.swatchImage) {
    return <Image source={{ uri: sibling.swatchImage }} style={style} contentFit="cover" accessibilityIgnoresInvertColors />;
  }
  if (!sibling.colourHex) return null;
  // Swatch colours are product data (the frame's acetate), not UI colours.
  return (
    <View className="overflow-hidden border border-border flex-row" style={style}>
      <View style={{ flex: 1, backgroundColor: sibling.colourHex }} />
      {sibling.colourHex2 ? <View style={{ flex: 1, backgroundColor: sibling.colourHex2 }} /> : null}
    </View>
  );
}

// --- Colour Card ---

interface ColourCardProps {
  sibling: ProductSibling;
  isCurrent: boolean;
  onPress: () => void;
}

const titleCase = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();

/** One colour of the family: its photo, swatch and name (the web shows the photo on hover). */
function ColourCard({ sibling, isCurrent, onPress }: ColourCardProps) {
  const name = titleCase(sibling.colour ?? sibling.title);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}${isCurrent ? ', current' : ''}`}
      accessibilityState={{ selected: isCurrent }}
      className="w-[120px]"
    >
      {({ pressed }) => (
        <View className={`rounded-lg overflow-hidden bg-bg-page ${isCurrent ? 'border-2 border-accent' : `border ${pressed ? 'border-text-tertiary' : 'border-border'}`}`} style={isCurrent ? undefined : { margin: 1 }}>
          <View className="bg-bg-subtle items-center justify-center" style={{ aspectRatio: 1 }}>
            {sibling.image ? (
              <Image source={{ uri: sibling.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityIgnoresInvertColors />
            ) : (
              <FrameSwatch sibling={sibling} size={36} />
            )}
          </View>
          <View className="flex-row items-center gap-[6px] px-[8px] py-[8px] border-t border-border">
            <FrameSwatch sibling={sibling} size={14} />
            <Text className={`flex-1 text-body-sm text-text-primary ${isCurrent ? 'font-medium' : ''}`} numberOfLines={1}>{name}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Family switcher for product detail (PRD-02).
 * Shows: Family Name → Optical/Sun toggle (when both exist) → Colour chips.
 * Mirrors Foundry's LunettiqFamilySwitcher pattern.
 */
type Kind = 'optical' | 'sun';
const kindOf = (s: Pick<ProductSibling, 'type'>): Kind => (s.type === 'sun' ? 'sun' : 'optical');
const colourKey = (s: Pick<ProductSibling, 'colour' | 'handle'>) => (s.colour ?? s.handle).trim().toLowerCase();

/**
 * What the switcher shows for the frame on screen. The active type is always the
 * current frame's (it used to be state set once, before the family had loaded, so
 * it stuck on Optical). Colours are matched without case ("GREEN" / "Green").
 * Pure, tested.
 */
export function familyView(siblings: ProductSibling[], current: { handle?: string; shopifyId: string }, fallbackType: Kind | null = null) {
  const currentSibling = siblings.find((s) => s.handle === current.handle || s.shopifyId === current.shopifyId);
  const activeType: Kind = currentSibling ? kindOf(currentSibling) : fallbackType ?? 'optical';
  const types = new Set(siblings.map(kindOf));
  const byOrder = (a: ProductSibling, b: ProductSibling) => a.sortOrder - b.sortOrder;
  const colours = siblings.filter((s) => kindOf(s) === activeType).sort(byOrder);
  /** Where a tap on Optical / Sun goes: the same colour in that type, else its first colour; null when already there. */
  const targetFor = (type: Kind): ProductSibling | null => {
    if (type === activeType) return null;
    const ofType = siblings.filter((s) => kindOf(s) === type).sort(byOrder);
    const sameColour = currentSibling ? ofType.find((s) => colourKey(s) === colourKey(currentSibling)) : undefined;
    return sameColour ?? ofType[0] ?? null;
  };
  return { currentSibling, activeType, colours, hasBothTypes: types.has('optical') && types.has('sun'), targetFor };
}

export function ColourSiblings({ productId, currentHandle, type }: ColourSiblingsProps) {
  const router = useRouter();
  const { data: family } = useProductFamily(productId);
  const view = useMemo(
    () => familyView(family?.siblings ?? [], { handle: currentHandle, shopifyId: productId }, type ?? null),
    [family?.siblings, currentHandle, productId, type],
  );
  const { currentSibling, activeType, hasBothTypes } = view;
  const filteredSiblings = view.colours;

  if (!family?.siblings?.length || (family.siblings.length <= 1 && !hasBothTypes)) return null;

  const handleSiblingPress = (sibling: ProductSibling) => {
    if (sibling.handle === currentHandle || sibling.shopifyId === productId) return;
    // Replace (not push) so back button returns to product list, not previous sibling
    router.replace(`/products/${sibling.shopifyId}`);
  };

  const handleTypeSwitch = (next: Kind) => {
    const target = view.targetFor(next);
    // Replace so Back returns to the list, not the other type.
    if (target) router.replace(`/products/${target.shopifyId}`);
  };

  return (
    <View className="gap-[12px]">
      {/* Family name header */}

      {/* Optical / Sun toggle */}
      {hasBothTypes && (
        <View className="flex-row">
          <View className="flex-row rounded-full overflow-hidden border border-border">
            <TypeButton
              label="Optical"
              active={activeType === 'optical'}
              onPress={() => handleTypeSwitch('optical')}
            />
            <TypeButton
              label="Sun"
              active={activeType === 'sun'}
              onPress={() => handleTypeSwitch('sun')}
            />
          </View>
        </View>
      )}

      {/* Colours: one card each, with the frame's photo, as on lunettiq.com (one colour still shows its name). */}
      {filteredSiblings.length >= 1 && (
        <View>
          <Text className="text-body-sm text-text-tertiary mb-[8px]">
            Colour <Text className="text-text-primary font-medium">{currentSibling?.colour ? titleCase(currentSibling.colour) : ''}</Text>
            {filteredSiblings.length > 1 ? ` · ${filteredSiblings.length} colours` : ''}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-[10px]">
              {filteredSiblings.map((sibling) => {
                const isCurrent = sibling.handle === currentHandle || sibling.shopifyId === productId;
                return (
                  <ColourCard
                    key={sibling.shopifyId}
                    sibling={sibling}
                    isCurrent={isCurrent}
                    onPress={() => handleSiblingPress(sibling)}
                  />
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
