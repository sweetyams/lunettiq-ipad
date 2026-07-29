import { View, Text, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Sheet, FieldLabel, Chip, Button } from '@/src/ui';
import { useMultiPairQuestionnaire, useSaveQuestionnaire } from '@/src/api/useMultiPair';
import type { LifestyleResponses } from '@/src/api/multi-pair.types';

interface LifestyleQuestionnaireSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function LifestyleQuestionnaireSheet({ 
  clientId, 
  visible, 
  onClose 
}: LifestyleQuestionnaireSheetProps) {
  const [mode, setMode] = useState<'staff' | 'client'>('staff');
  const [responses, setResponses] = useState<LifestyleResponses>({});
  
  const { data: existingQuestionnaires } = useMultiPairQuestionnaire(clientId);
  const saveQuestionnaireMutation = useSaveQuestionnaire();
  const existingData = existingQuestionnaires?.[0] ?? null;

  // Load existing data when available
  useEffect(() => {
    if (existingData?.responses) {
      setResponses(existingData.responses);
    }
  }, [existingData]);

  const updateResponse = <T extends keyof LifestyleResponses>(
    field: T,
    value: LifestyleResponses[T]
  ) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  const updateMultiSelectResponse = (field: 'sports' | 'hobbies', value: string) => {
    setResponses(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSave = async () => {
    try {
      await saveQuestionnaireMutation.mutateAsync({
        customerId: clientId,
        responses
      });
      onClose();
    } catch (error) {
      console.error('Failed to save questionnaire:', error);
    }
  };

  const countAnswered = () => {
    let count = 0;
    if (responses.sports?.length) count++;
    if (responses.screenTime) count++;
    if (responses.outdoorHours) count++;
    if (responses.driving) count++;
    if (responses.glareSensitivity) count++;
    if (responses.hobbies?.length) count++;
    if (responses.primaryConcern) count++;
    return count;
  };

  const primaryUseOptions = [
    'Office/screens',
    'Driving', 
    'Reading',
    'Sport/outdoors',
    'All-day wear',
    'Social/evening'
  ];

  const screenTimeOptions = [
    { label: 'Under 2h', value: 'minimal' as const },
    { label: '2-5h', value: 'moderate' as const },
    { label: '5-8h', value: 'heavy' as const },
    { label: 'Over 8h', value: 'extreme' as const }
  ];

  const outdoorOptions = [
    { label: 'Rarely', value: 'minimal' as const },
    { label: 'Weekends', value: 'moderate' as const },
    { label: 'Daily', value: 'heavy' as const },
    { label: 'Works outdoors', value: 'heavy' as const }
  ];

  const drivingOptions = [
    { label: 'Daily commute', value: 'daily' as const },
    { label: 'Few times/week', value: 'occasional' as const },
    { label: 'Weekends only', value: 'occasional' as const },
    { label: 'Rarely', value: 'none' as const }
  ];

  const sensitivityOptions = [
    { label: 'Very sensitive', value: 'severe' as const },
    { label: 'Somewhat', value: 'moderate' as const },
    { label: 'Not particularly', value: 'mild' as const },
    { label: 'Only in bright sun', value: 'none' as const }
  ];

  const styleOptions = [
    'Bold/statement',
    'Classic/timeless',
    'Sporty/technical',
    'Lightweight/minimal',
    'Trend-led'
  ];

  const budgetOptions = [
    { label: 'Under $200', value: 'vision' as const },
    { label: '$200-$400', value: 'style' as const },
    { label: '$400-$600', value: 'protection' as const },
    { label: 'Over $600', value: 'convenience' as const },
    { label: 'Insurance covers it', value: 'convenience' as const }
  ];

  const headerRight = (
    <View className="flex-row gap-xs">
      <Chip
        label="Staff — one page"
        variant={mode === 'staff' ? 'on' : 'default'}
        onPress={() => setMode('staff')}
      />
      <Chip
        label="Hand to client — guided"
        variant={mode === 'client' ? 'on' : 'default'}
        onPress={() => setMode('client')}
      />
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Lifestyle"
      subtitle={clientId}
      headerRight={headerRight}
      wide
    >
      <ScrollView className="flex-1">
        {/* Question 1: Primary Use */}
        <View className="py-md border-b border-color-bg-muted">
          <Text className="text-body-md font-medium text-color-text-primary">
            What do they primarily use their glasses for?
          </Text>
          <Text className="text-body-sm text-color-text-muted">
            Select all that apply
          </Text>
          <View className="flex-row flex-wrap gap-sm mt-[10px]">
            {primaryUseOptions.map(option => (
              <Chip
                key={option}
                label={option}
                variant={responses.sports?.includes(option) ? 'on' : 'default'}
                onPress={() => updateMultiSelectResponse('sports', option)}
              />
            ))}
          </View>
        </View>

        {/* Question 2: Screen Time */}
        <View className="py-md border-b border-color-bg-muted">
          <Text className="text-body-md font-medium text-color-text-primary">
            Daily screen time
          </Text>
          <View className="flex-row flex-wrap gap-sm mt-[10px]">
            {screenTimeOptions.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                variant={responses.screenTime === option.value ? 'on' : 'default'}
                onPress={() => updateResponse('screenTime', option.value)}
              />
            ))}
          </View>
        </View>

        {/* Question 3: Outdoors */}
        <View className="py-md border-b border-color-bg-muted">
          <Text className="text-body-md font-medium text-color-text-primary">
            Time spent outdoors
          </Text>
          <View className="flex-row flex-wrap gap-sm mt-[10px]">
            {outdoorOptions.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                variant={responses.outdoorHours === option.value ? 'on' : 'default'}
                onPress={() => updateResponse('outdoorHours', option.value)}
              />
            ))}
          </View>
        </View>

        {/* Question 4: Driving */}
        <View className="py-md border-b border-color-bg-muted">
          <Text className="text-body-md font-medium text-color-text-primary">
            How often do they drive?
          </Text>
          <View className="flex-row flex-wrap gap-sm mt-[10px]">
            {drivingOptions.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                variant={responses.driving === option.value ? 'on' : 'default'}
                onPress={() => updateResponse('driving', option.value)}
              />
            ))}
          </View>
        </View>

        {/* Question 5: Light Sensitivity */}
        <View className="py-md border-b border-color-bg-muted">
          <Text className="text-body-md font-medium text-color-text-primary">
            Light sensitivity
          </Text>
          <View className="flex-row flex-wrap gap-sm mt-[10px]">
            {sensitivityOptions.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                variant={responses.glareSensitivity === option.value ? 'on' : 'default'}
                onPress={() => updateResponse('glareSensitivity', option.value)}
              />
            ))}
          </View>
        </View>

        {/* Question 6: Frame Styles */}
        <View className="py-md border-b border-color-bg-muted">
          <Text className="text-body-md font-medium text-color-text-primary">
            Frame styles for a second pair
          </Text>
          <Text className="text-body-sm text-color-text-muted">
            Select all that apply
          </Text>
          <View className="flex-row flex-wrap gap-sm mt-[10px]">
            {styleOptions.map(option => (
              <Chip
                key={option}
                label={option}
                variant={responses.hobbies?.includes(option) ? 'on' : 'default'}
                onPress={() => updateMultiSelectResponse('hobbies', option)}
              />
            ))}
          </View>
        </View>

        {/* Question 7: Budget */}
        <View className="py-md border-b border-color-bg-muted">
          <Text className="text-body-md font-medium text-color-text-primary">
            Comfortable budget for additional pair
          </Text>
          <View className="flex-row flex-wrap gap-sm mt-[10px]">
            {budgetOptions.map(option => (
              <Chip
                key={option.value}
                label={option.label}
                variant={responses.primaryConcern === option.value ? 'on' : 'default'}
                onPress={() => updateResponse('primaryConcern', option.value)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="flex-row justify-between items-center p-lg border-t border-color-border">
        <Text className="text-body-sm text-color-text-muted">
          {countAnswered()} of 7 answered · saves as one record
        </Text>
        <View className="flex-row gap-md">
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSave}
            loading={saveQuestionnaireMutation.isPending}
          >
            Save lifestyle
          </Button>
        </View>
      </View>
    </Sheet>
  );
}