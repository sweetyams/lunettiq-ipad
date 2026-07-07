import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useInteractions, useCreateInteraction } from '../../api/useInteractions';
import { TimelineEntry } from '../../ui/TimelineEntry';
import { Button } from '../../ui/Button';
import { LoadingState } from '../../ui/LoadingState';
import { ErrorState } from '../../ui/ErrorState';
import { EmptyState } from '../../ui/EmptyState';
import type { Interaction } from '../../api/interactions.types';

interface ClientTimelineProps {
  shopifyCustomerId: string;
}

export function ClientTimeline({ shopifyCustomerId }: ClientTimelineProps) {
  const [noteText, setNoteText] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useInteractions(shopifyCustomerId);

  const createInteraction = useCreateInteraction();

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      await createInteraction.mutateAsync({
        shopifyCustomerId,
        type: 'note',
        direction: 'internal',
        body: noteText.trim(),
        metadata: {},
      });
      
      setNoteText('');
      setShowAddNote(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  };

  const interactions = response?.interactions || [];
  
  // Sort by occurredAt descending (most recent first)
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
      />
    );
  }

  if (sortedInteractions.length === 0) {
    return (
      <View className="flex-1">
        {/* Add Note Section */}
        <View className="p-lg bg-offWhite border-b border-warmGrey">
          <Button
            variant="primary"
            onPress={() => setShowAddNote(true)}
          >
            <View className="flex-row items-center">
              <Plus size={20} color="white" />
              <Text className="text-white font-medium ml-sm">Add Note</Text>
            </View>
          </Button>
        </View>

        <EmptyState 
          message="No timeline entries yet"
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Interaction }) => (
    <TimelineEntry interaction={item} />
  );

  return (
    <View className="flex-1 bg-offWhite">
      {/* Add Note Section */}
      <View className="bg-offWhite border-b border-warmGrey">
        {showAddNote ? (
          <View className="p-lg">
            <TextInput
              className="border border-warmGrey rounded-md p-md text-[17px] bg-white mb-md"
              placeholder="Add a note about this client..."
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View className="flex-row space-x-md">
              <Button
                variant="primary"
                onPress={handleAddNote}
                disabled={!noteText.trim() || createInteraction.isPending}
              >
                {createInteraction.isPending ? 'Saving...' : 'Save Note'}
              </Button>
              <Button
                variant="ghost"
                onPress={() => {
                  setShowAddNote(false);
                  setNoteText('');
                }}
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <View className="p-lg">
            <Button
              variant="primary"
              onPress={() => setShowAddNote(true)}
            >
              <View className="flex-row items-center">
                <Plus size={20} color="white" />
                <Text className="text-white font-medium ml-sm">Add Note</Text>
              </View>
            </Button>
          </View>
        )}
      </View>

      {/* Timeline List */}
      <FlatList
        data={sortedInteractions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}