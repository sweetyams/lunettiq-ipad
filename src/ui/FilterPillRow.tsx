import { ScrollView, Pressable, Text, View } from 'react-native';

interface FilterOption {
  key: string;
  label: string;
  value: string;
  swatchHex?: string | null;
}

interface FilterPillRowProps {
  filters: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
}

export function FilterPillRow({ filters, selected, onToggle, disabled = false }: FilterPillRowProps) {
  if (filters.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-sm"
    >
      {filters.map((filter) => {
        const isSelected = selected.includes(filter.value);
        return (
          <Pressable
            key={filter.key}
            onPress={() => !disabled && onToggle(filter.value)}
            accessibilityRole="button"
            accessibilityLabel={`${filter.label} filter${isSelected ? ', selected' : ''}`}
            accessibilityState={{ selected: isSelected, disabled }}
            className={`min-h-[44px] min-w-[44px] px-md py-sm rounded-full flex-row items-center justify-center border ${
              disabled
                ? 'border-border opacity-40'
                : isSelected
                  ? 'bg-brand border-brand'
                  : 'border-border bg-bg-elevated'
            }`}
          >
            {/* Colour swatch dot */}
            {filter.swatchHex && (
              <View
                className={`w-4 h-4 rounded-full mr-xs border ${isSelected ? 'border-white/50' : 'border-border'}`}
                style={{ backgroundColor: filter.swatchHex }}
                accessibilityLabel={`${filter.label} colour swatch`}
              />
            )}
            <Text
              className={`text-caption font-medium ${
                disabled
                  ? 'text-text-muted'
                  : isSelected
                    ? 'text-brand-text'
                    : 'text-text-primary'
              }`}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
