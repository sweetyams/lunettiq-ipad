import { View, Text, TextInput } from 'react-native';
import { useState } from 'react';
import { Sheet, FieldLabel, Chip, Button } from '@/src/ui';

interface LinkClientSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

const RELATIONSHIP_TYPES = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Partner',
  'Other',
];

export function LinkClientSheet({ clientId, visible, onClose }: LinkClientSheetProps) {
  // TODO: Integrate with useClients search for real client lookup
  // TODO: Call POST /api/clients/{id}/links when API endpoint confirmed
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isLinking, setIsLinking] = useState(false);

  const handleRelationshipTypePress = (type: string) => {
    setSelectedType(type === selectedType ? null : type);
  };

  const handleLink = async () => {
    if (!selectedClient || !selectedType) return;
    
    setIsLinking(true);
    try {
      // TODO: Implement actual linking API call
      // await linkClients({ clientId, linkedClientId: selectedClient.id, relationshipType: selectedType });
      
      console.log('Would link client:', {
        clientId,
        linkedClientId: selectedClient.id,
        relationshipType: selectedType,
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to link clients:', error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedType(null);
    setSelectedClient(null);
    onClose();
  };

  const canLink = selectedClient && selectedType;

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Link a client"
      subtitle="Create a household or relationship link"
      footer={
        <View className="flex-row gap-md">
          <Button
            variant="ghost"
            onPress={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleLink}
            disabled={!canLink || isLinking}
            className="flex-1"
          >
            {isLinking ? 'Linking...' : 'Link client'}
          </Button>
        </View>
      }
    >
      <View className="gap-lg">
        <View className="gap-sm">
          <FieldLabel>Search for client</FieldLabel>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or email..."
            className="bg-color-bg-surface border border-color-border rounded-md p-md text-body-lg text-color-text-primary"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {/* TODO: Replace with actual search results */}
          {searchQuery.length >= 2 && (
            <View className="gap-xs">
              <Text className="text-body-sm text-color-text-muted">
                Search results (placeholder)
              </Text>
              <View className="bg-color-bg-surface border border-color-border rounded-md p-md">
                <Button
                  variant="ghost"
                  onPress={() => setSelectedClient({ id: 'mock-1', name: 'Mock Client' })}
                  className="justify-start"
                >
                  <Text className="text-body-lg text-color-text-primary">
                    {searchQuery} (Mock Result)
                  </Text>
                </Button>
              </View>
            </View>
          )}
          
          {selectedClient && (
            <View className="bg-color-bg-muted rounded-md p-md">
              <Text className="text-body-lg text-color-text-primary font-medium">
                Selected: {selectedClient.name}
              </Text>
            </View>
          )}
        </View>

        <View className="gap-sm">
          <FieldLabel>Relationship type</FieldLabel>
          <View className="flex-row flex-wrap gap-sm">
            {RELATIONSHIP_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                variant={selectedType === type ? 'on' : 'default'}
                onPress={() => handleRelationshipTypePress(type)}
              />
            ))}
          </View>
        </View>

        {/* TODO: Remove this placeholder text when API is integrated */}
        <View className="bg-color-bg-muted rounded-md p-md">
          <Text className="text-body-sm text-color-text-secondary">
            Note: This is a placeholder UI. Client search and linking API integration is pending.
          </Text>
        </View>
      </View>
    </Sheet>
  );
}