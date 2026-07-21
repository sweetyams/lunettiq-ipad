import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import type { FiltersResponse, FilterGroup } from '@/src/api/filters.types';

// Stock filter is always shown at the top
const STOCK_OPTIONS = [
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filterData: FiltersResponse | undefined;
  selectedFacets: Record<string, string[]>;
  selectedStock: string[];
  onFacetToggle: (groupCode: string, value: string) => void;
  onStockToggle: (value: string) => void;
  onClear: () => void;
  activeCount: number;
}

export function FilterSheet({
  visible,
  onClose,
  filterData,
  selectedFacets,
  selectedStock,
  onFacetToggle,
  onStockToggle,
  onClear,
  activeCount,
}: FilterSheetProps) {
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close filter sheet"
      >
        {/* Sheet — stops event propagation so tapping inside doesn't close */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-bg-elevated rounded-t-2xl"
          style={{ maxHeight: height * 0.72 }}
        >
          {/* Handle */}
          <View className="items-center pt-sm pb-xs">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-xl pb-md border-b border-border">
            <Text className="text-headline font-semibold text-text-primary">
              Filters{activeCount > 0 ? ` · ${activeCount} active` : ''}
            </Text>
            <View className="flex-row items-center gap-md">
              {activeCount > 0 && (
                <Pressable
                  onPress={onClear}
                  className="min-h-[44px] min-w-[44px] items-center justify-center px-md"
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                >
                  <Text className="text-body text-text-secondary">Clear all</Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                className="w-[44px] h-[44px] items-center justify-center rounded-full bg-bg-surface"
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={18} color="#2B2B2B" />
              </Pressable>
            </View>
          </View>

          {/* Scrollable filter content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Stock section — always first */}
            <FilterSection title="Availability">
              <View className="flex-row flex-wrap gap-sm px-xl">
                {STOCK_OPTIONS.map((opt) => {
                  const isSelected = selectedStock.includes(opt.value);
                  return (
                    <FilterPill
                      key={opt.value}
                      label={opt.label}
                      isSelected={isSelected}
                      onPress={() => onStockToggle(opt.value)}
                    />
                  );
                })}
              </View>
            </FilterSection>

            {/* Dynamic filter groups from API */}
            {filterData?.groups.map((group) => (
              <FilterSection
                key={group.id}
                title={group.label?.en ?? group.code}
              >
                {group.displayType === 'swatch' ? (
                  // Swatch grid for colour filters
                  <SwatchGrid
                    group={group}
                    selected={selectedFacets[group.code] ?? []}
                    onToggle={(value) => onFacetToggle(group.code, value)}
                  />
                ) : (
                  // Pill row for text filters
                  <View className="flex-row flex-wrap gap-sm px-xl">
                    {group.values.map((v) => {
                      const isSelected = (selectedFacets[group.code] ?? []).includes(v.value);
                      return (
                        <FilterPill
                          key={v.id}
                          label={v.label?.en ?? v.value}
                          isSelected={isSelected}
                          onPress={() => onFacetToggle(group.code, v.value)}
                        />
                      );
                    })}
                  </View>
                )}
              </FilterSection>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- Sub-components ---

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="pt-lg">
      <Text className="text-captionStrong font-semibold text-text-muted uppercase tracking-wider px-xl mb-sm">
        {title}
      </Text>
      {children}
    </View>
  );
}

function FilterPill({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${isSelected ? ', selected' : ''}`}
      accessibilityState={{ selected: isSelected }}
      className={`min-h-[44px] px-md py-sm rounded-full border flex-row items-center ${
        isSelected
          ? 'bg-brand border-brand'
          : 'bg-bg-page border-border'
      }`}
    >
      {isSelected && <Check size={14} color="#FFFFFF" style={{ marginRight: 6 }} />}
      <Text
        className={`text-caption font-medium ${
          isSelected ? 'text-brand-text' : 'text-text-primary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SwatchGrid({
  group,
  selected,
  onToggle,
}: {
  group: FilterGroup;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-sm px-xl">
      {group.values.map((v) => {
        const isSelected = selected.includes(v.value);
        const label = v.label?.en ?? v.value;

        return (
          <Pressable
            key={v.id}
            onPress={() => onToggle(v.value)}
            accessibilityRole="button"
            accessibilityLabel={`${label}${isSelected ? ', selected' : ''}`}
            accessibilityState={{ selected: isSelected }}
            className="items-center gap-xs"
            style={{ minWidth: 52, minHeight: 44 }}
          >
            {/* Swatch circle */}
            <View
              className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                isSelected ? 'border-brand' : 'border-transparent'
              }`}
            >
              <View
                className="w-8 h-8 rounded-full border border-border"
                style={{ backgroundColor: v.swatchHex ?? '#E8E4DE' }}
              />
              {isSelected && (
                <View className="absolute inset-0 items-center justify-center">
                  <Check size={14} color={isLightColour(v.swatchHex) ? '#000' : '#fff'} />
                </View>
              )}
            </View>
            {/* Label */}
            <Text
              className={`text-captionStrong text-center ${
                isSelected ? 'text-text-primary' : 'text-text-muted'
              }`}
              numberOfLines={1}
              style={{ maxWidth: 56 }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Determine if a hex colour is light (for checkmark contrast) */
function isLightColour(hex: string | null): boolean {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Perceived luminance
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
