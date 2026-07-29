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
        active ? 'bg-color-brand' : 'bg-color-bg-surface'
      }`}
    >
      <Text
        className={`text-body-md font-medium ${
          active ? 'text-color-brand-text' : 'text-color-text-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// --- Colour Chip ---

interface ColourChipProps {
  sibling: ProductSibling;
  isCurrent: boolean;
  onPress: () => void;
}

function ColourChip({ sibling, isCurrent, onPress }: ColourChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${sibling.colour ?? sibling.title}${isCurrent ? ', current' : ''}`}
      accessibilityState={{ selected: isCurrent }}
      className={`min-h-[44px] min-w-[44px] px-md py-sm rounded-full flex-row items-center justify-center border ${
        isCurrent
          ? 'bg-color-brand border-color-brand'
          : 'bg-color-bg-surface border-color-border'
      }`}
    >
      {/* Colour swatch circle */}
      {sibling.colourHex && (
        <View
          className={`w-5 h-5 rounded-full mr-xs border ${isCurrent ? 'border-white/50' : 'border-color-border'}`}
          style={{ backgroundColor: sibling.colourHex }}
        />
      )}
      {/* Image thumbnail (fallback if no hex) */}
      {!sibling.colourHex && sibling.image && (
        <View className="w-5 h-5 rounded-full mr-xs overflow-hidden border border-color-border">
          <Image
            source={{ uri: sibling.image }}
            style={{ width: 20, height: 20 }}
            contentFit="cover"
          />
        </View>
      )}
      <Text
        className={`text-caption-lg font-medium ${
          isCurrent ? 'text-color-brand-text' : 'text-color-text-primary'
        }`}
        numberOfLines={1}
      >
        {sibling.colour ?? sibling.title}
      </Text>
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
    <View className="p-lg bg-color-bg-surface border-b border-color-border">
      {/* Family name header */}
      <Text className="text-body-md font-medium text-color-text-primary mb-md">
        {family?.familyName?.toUpperCase() ?? 'Family'}
      </Text>

      {/* Optical / Sun toggle */}
      {hasBothTypes && (
        <View className="flex-row mb-md">
          <View className="flex-row rounded-full overflow-hidden border border-color-border">
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

      {/* Colour chips */}
      {filteredSiblings.length > 1 && (
        <View>
          <Text className="text-caption-lg text-color-text-muted mb-sm">
            Colour: <Text className="text-color-text-primary">{currentSibling?.colour ?? ''}</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-sm">
              {filteredSiblings.map((sibling) => {
                const isCurrent = sibling.handle === currentHandle || sibling.shopifyId === productId;
                return (
                  <ColourChip
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
