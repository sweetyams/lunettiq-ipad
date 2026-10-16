import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { useLocations, locationName, type Location } from '@/src/api/useLocations';
import { Sheet, ListRow, kitColors, formatPhone } from '@/src/ui/kit';

interface LocationPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (locationId: string) => void;
  selectedLocationId?: string | null;
  /** Sheet title — defaults to the client home-location wording. */
  title?: string;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function todayHours(location: Location): string {
  const h = location.operatingHours?.[DAYS[new Date().getDay()]!];
  return h ? `Open today ${h.open}–${h.close}` : 'Closed today';
}

export function LocationPickerSheet({ isOpen, onClose, onSelect, selectedLocationId, title = 'Home store' }: LocationPickerSheetProps) {
  const { data: locations, isLoading, error } = useLocations();
  const list = locations ?? [];

  return (
    <Sheet visible={isOpen} onClose={onClose} title={title}>
      {isLoading ? (
        <Text className="text-body-md text-text-tertiary">Loading stores…</Text>
      ) : error ? (
        <Text className="text-body-md text-text-tertiary">Couldn’t load stores. Check the connection and try again.</Text>
      ) : list.length === 0 ? (
        <Text className="text-body-md text-text-tertiary">No stores set up yet.</Text>
      ) : (
        <View className="border border-border rounded-md overflow-hidden -mx-[4px]">
          {list.map((loc, i) => {
            const selected = selectedLocationId === loc.id;
            return (
              <ListRow
                key={loc.id}
                divider={i > 0}
                selected={selected}
                onPress={() => { onSelect(loc.id); onClose(); }}
                accessibilityLabel={`${locationName(loc)}${selected ? ', selected' : ''}`}
                title={locationName(loc)}
                subtitle={[loc.address, todayHours(loc), formatPhone(loc.phone)].filter(Boolean).join(' · ')}
                trailing={selected ? <Check size={20} color={kitColors.text} /> : undefined}
              />
            );
          })}
        </View>
      )}
    </Sheet>
  );
}
