import { View } from 'react-native';
import { Sheet, Field, ChoiceChips } from '@/src/ui/kit';
import type { FiltersResponse } from '@/src/api/filters.types';

const STOCK_OPTIONS = [
  { key: 'in', label: 'In stock' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
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

/** Catalogue filters: stock, then each Foundry facet group (shape, colour, material…). */
export function FilterSheet({
  visible, onClose, filterData, selectedFacets, selectedStock, onFacetToggle, onStockToggle, onClear, activeCount,
}: FilterSheetProps) {
  // ChoiceChips reports the full next selection; translate to the screen's toggle API.
  const toggleDiff = (current: string[], next: string[], toggle: (v: string) => void) => {
    const added = next.find((v) => !current.includes(v));
    const removed = current.find((v) => !next.includes(v));
    const changed = added ?? removed;
    if (changed) toggle(changed);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title="Filter frames"
      subtitle={activeCount ? `${activeCount} active` : undefined}
      secondary={{ label: 'Clear all', onPress: onClear, disabled: activeCount === 0 }}
      primary={{ label: 'Show frames', onPress: onClose }}
    >
      <View className="gap-[24px]">
        <Field label="Stock">
          <ChoiceChips multiple options={STOCK_OPTIONS} value={selectedStock} onChange={(next: string[]) => toggleDiff(selectedStock, next, onStockToggle)} />
        </Field>
        {(filterData?.groups ?? []).filter((g) => g.values.length).map((g) => {
          const current = selectedFacets[g.code] ?? [];
          return (
            <Field key={g.id} label={g.label.en ?? g.label.fr ?? g.code}>
              <ChoiceChips
                multiple
                options={g.values.map((v) => ({ key: v.value, label: v.label.en ?? v.label.fr ?? v.value }))}
                value={current}
                onChange={(next: string[]) => toggleDiff(current, next, (v) => onFacetToggle(g.code, v))}
              />
            </Field>
          );
        })}
      </View>
    </Sheet>
  );
}
