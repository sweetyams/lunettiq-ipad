import { View, Text, Pressable, ScrollView, Modal } from 'react-native'; import { Dimensions } from 'react-native';
import { MapPin, Clock, X } from 'lucide-react-native';
import { useLocations, locationName, type Location } from '@/src/api/useLocations';
import { Card, LoadingState, ErrorState } from '@/src/ui';

interface LocationPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (locationId: string) => void;
  selectedLocationId?: string | null;
  /** Sheet title — defaults to the client home-location wording. */
  title?: string;
}

export function LocationPickerSheet({
  isOpen,
  onClose,
  onSelect,
  selectedLocationId,
  title = 'Select Home Location',
}: LocationPickerSheetProps) {
  const { data: locations, isLoading, error } = useLocations();

  const formatHours = (location: Location) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const todayIndex = new Date().getDay();
    const adjustedIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Sunday=0 → index 6

    const todayKey = days[adjustedIndex];
    const todayHours = location.operatingHours?.[todayKey as string];

    if (!todayHours) {
      return 'Closed today';
    }

    return `Today: ${todayHours.open} - ${todayHours.close}`;
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-bg-surface">
        {/* Header */}
        <View className="flex-row items-center justify-between px-xl pt-xl pb-md border-b border-border">
          <Pressable
            onPress={onClose}
            className="min-h-[44px] min-w-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X color="#404040" size={22} />
          </Pressable>
          <Text className="text-heading-md text-text-primary font-medium">{title}</Text>
          <View className="min-w-[44px]" />
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-xl py-lg" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
        {isLoading && <LoadingState />}
        
        {error && (
          <ErrorState 
            error="Failed to load locations" 
            onRetry={() => {}} 
          />
        )}

        {locations && (
          <View className="gap-sm">
            {locations.map((location) => (
                <Pressable
                  key={location.id}
                  onPress={() => {
                    onSelect(location.id);
                    onClose();
                  }}
                  className="min-h-[44px]"
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${locationName(location)}`}
                >
                  <Card 
                    className={`p-md ${
                      selectedLocationId === location.id 
                        ? 'ring-2 ring-brand bg-brand/5' 
                        : ''
                    }`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-heading-sm text-text-primary font-semibold mb-xs">
                          {locationName(location)}
                        </Text>
                        
                        {location.address && (
                          <View className="flex-row items-start mb-sm">
                            <MapPin 
                              color="#737373" 
                              size={16} 
                              className="mt-0.5 mr-xs" 
                            />
                            <View className="flex-1">
                              <Text className="text-body-md text-text-secondary">
                                {location.address}
                              </Text>
                            </View>
                          </View>
                        )}

                        <View className="flex-row items-center">
                          <Clock color="#737373" size={16} className="mr-xs" />
                          <Text className="text-body-sm text-text-muted">
                            {formatHours(location)}
                          </Text>
                        </View>

                        {location.phone && (
                          <Text className="text-body-sm text-text-muted mt-xs">
                            {location.phone}
                          </Text>
                        )}
                      </View>

                      {selectedLocationId === location.id && (
                        <View className="w-6 h-6 rounded-full bg-brand items-center justify-center ml-md">
                          <View className="w-2 h-2 rounded-full bg-brand-text" />
                        </View>
                      )}
                    </View>
                  </Card>
                </Pressable>
              ))}
          </View>
        )}

        {/* No locations fallback */}
        {locations && locations.length === 0 && (
          <View className="flex-1 items-center justify-center p-lg">
            <MapPin color="#737373" size={48} />
            <Text className="text-heading-md text-text-muted mt-md text-center">
              No locations available
            </Text>
          </View>
        )}
        </ScrollView>
      </View>
    </Modal>
  );
}