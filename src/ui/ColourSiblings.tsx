import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useProductFamily } from '@/src/api/useProductFamily';
import type { ProductSibling } from '@/src/api/families.types';

interface ColourSiblingsProps {
  productId: string;
  currentHandle?: string;
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
export function ColourSiblings({ productId, currentHandle }: ColourSiblingsProps) {
  const router = useRouter();
  const { data: family, isLoading } = useProductFamily(productId);

  // Determine current product's type from siblings
  const currentSibling = family?.siblings.find(
    (s) => s.handle === currentHandle || s.shopifyId === productId
  );
  const currentType = currentSibling?.type ?? 'optical';

  // State: which type tab is selected (optical or sun)
  const [selectedType, setSelectedType] = useState<'optical' | 'sun'>(
    currentType === 'sun' ? 'sun' : 'optical'
  );

  // Group siblings by colour to find optical/sun pairs
  const { colourGroups, hasOptical, hasSun, hasBothTypes } = useMemo(() => {
    if (!family?.siblings) return { colourGroups: new Map(), hasOptical: false, hasSun: false, hasBothTypes: false };

    const groups = new Map<string, { optical: ProductSibling | null; sun: ProductSibling | null }>();
    for (const s of family.siblings) {
      const key = s.colour ?? s.handle;
      const group = groups.get(key) ?? { optical: null, sun: null };
      if (s.type === 'sun') {
        group.sun = s;
      } else {
        // 'optical' or null defaults to optical
        group.optical = s;
      }
      groups.set(key, group);
    }

    const hasOpt = family.siblings.some((s) => s.type !== 'sun');
    const hasSn = family.siblings.some((s) => s.type === 'sun');
    return { colourGroups: groups, hasOptical: hasOpt, hasSun: hasSn, hasBothTypes: hasOpt && hasSn };
  }, [family?.siblings]);

  // Filtered siblings for current type
  const filteredSiblings = useMemo(() => {
    const siblings: ProductSibling[] = [];
    for (const [, group] of colourGroups) {
      const sibling = selectedType === 'sun'
        ? (group.sun ?? group.optical)
        : (group.optical ?? group.sun);
      if (sibling) siblings.push(sibling);
    }
    return siblings.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [colourGroups, selectedType]);

  if (isLoading || !family || !family.siblings || family.siblings.length <= 1) {
    // No siblings or loading — only render if there are types to toggle
    if (!hasBothTypes) return null;
  }

  const handleSiblingPress = (sibling: ProductSibling) => {
    if (sibling.handle === currentHandle || sibling.shopifyId === productId) return;
    // Replace (not push) so back button returns to product list, not previous sibling
    router.replace(`/products/${sibling.shopifyId}`);
  };

  const handleTypeSwitch = (type: 'optical' | 'sun') => {
    if (type === selectedType) return;
    setSelectedType(type);

    // Navigate to the same colour in the new type (if available)
    const currentColour = currentSibling?.colour;
    if (currentColour) {
      const group = colourGroups.get(currentColour);
      const target = type === 'sun' ? group?.sun : group?.optical;
      if (target && target.handle !== currentHandle && target.shopifyId !== productId) {
        // Replace so back button returns to product list, not previous type variant
        router.replace(`/products/${target.shopifyId}`);
      }
    }
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
              active={selectedType === 'optical'}
              onPress={() => handleTypeSwitch('optical')}
            />
            <TypeButton
              label="Sun"
              active={selectedType === 'sun'}
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
