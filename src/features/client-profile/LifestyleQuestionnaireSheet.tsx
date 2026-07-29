import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, Pressable, Alert } from 'react-native'; import { Dimensions } from 'react-native';
import { Button } from '@/src/ui/Button';
import { useMultiPairQuestionnaire, useSaveQuestionnaire } from '@/src/api/useMultiPair';
import type { LifestyleResponses as ApiLifestyleResponses } from '@/src/api/multi-pair.types';

interface LifestyleQuestionnaireSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

interface LifestyleResponses {
  driving: string;
  screenTime: string;
  sports: string;
  hobbies: string;
  glareSensitivity: string;
  outdoorHours: string;
  workEnvironment: string;
  existingPairs: string;
  lastSunglassPurchase: string;
  primaryConcern: string;
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-md py-sm rounded-md border min-w-[44px] min-h-[44px] justify-center ${
        selected 
          ? 'bg-bg-inverse border-bg-inverse' 
          : 'bg-bg-surface border-border'
      }`}
    >
      <Text className={`text-body-md text-center ${
        selected ? 'text-text-inverse' : 'text-text-primary'
      }`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function LifestyleQuestionnaireSheet({ clientId, visible, onClose }: LifestyleQuestionnaireSheetProps) {
  const { data: questionnaire } = useMultiPairQuestionnaire(clientId);
  const saveQuestionnaire = useSaveQuestionnaire();
  
  const [mode, setMode] = useState<'staff' | 'guided'>('staff');
  const [answers, setAnswers] = useState<LifestyleResponses>({
    driving: '',
    screenTime: '',
    sports: '',
    hobbies: '',
    glareSensitivity: '',
    outdoorHours: '',
    workEnvironment: '',
    existingPairs: '',
    lastSunglassPurchase: '',
    primaryConcern: '',
  });

  useEffect(() => {
    if (questionnaire && questionnaire.length > 0) {
      const latest = questionnaire[0]?.responses;
      if (latest) {
        setAnswers({
          driving: latest.driving || '',
          screenTime: latest.screenTime || '',
          sports: (latest.sports || []).join(','),
          hobbies: (latest.hobbies || []).join(','),
          glareSensitivity: latest.glareSensitivity || '',
          outdoorHours: latest.outdoorHours || '',
          workEnvironment: latest.workEnvironment || '',
          existingPairs: latest.existingPairs ? String(latest.existingPairs) : '',
          lastSunglassPurchase: latest.lastSunglassPurchase || '',
          primaryConcern: latest.primaryConcern || '',
        });
      }
    }
  }, [questionnaire]);

  const questions = [
    {
      key: 'driving' as keyof LifestyleResponses,
      title: 'How often do they drive?',
      type: 'single' as const,
      options: ['none', 'occasional', 'daily', 'professional'],
    },
    {
      key: 'screenTime' as keyof LifestyleResponses,
      title: 'Daily screen time?',
      type: 'single' as const,
      options: ['minimal', 'moderate', 'heavy', 'extreme'],
    },
    {
      key: 'sports' as keyof LifestyleResponses,
      title: 'Sports & activities?',
      type: 'multi' as const,
      options: ['running', 'cycling', 'swimming', 'skiing', 'golf', 'tennis', 'gym', 'yoga', 'none'],
    },
    {
      key: 'hobbies' as keyof LifestyleResponses,
      title: 'Hobbies? (select all)',
      type: 'multi' as const,
      options: ['reading', 'crafts', 'photography', 'cooking', 'gardening', 'gaming', 'travel', 'music'],
    },
    {
      key: 'glareSensitivity' as keyof LifestyleResponses,
      title: 'Light sensitivity?',
      type: 'single' as const,
      options: ['none', 'mild', 'moderate', 'severe'],
    },
    {
      key: 'outdoorHours' as keyof LifestyleResponses,
      title: 'Time spent outdoors?',
      type: 'single' as const,
      options: ['minimal', 'moderate', 'heavy'],
    },
    {
      key: 'workEnvironment' as keyof LifestyleResponses,
      title: 'Work environment?',
      type: 'single' as const,
      options: ['office', 'outdoor', 'mixed', 'industrial'],
    },
    {
      key: 'existingPairs' as keyof LifestyleResponses,
      title: 'Current pairs owned?',
      type: 'single' as const,
      options: ['0', '1', '2', '3+'],
    },
    {
      key: 'primaryConcern' as keyof LifestyleResponses,
      title: 'Primary concern?',
      type: 'single' as const,
      options: ['vision', 'style', 'protection', 'convenience'],
    },
  ];

  const handleSingleSelect = (key: keyof LifestyleResponses, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: prev[key] === value ? '' : value
    }));
  };

  const handleMultiSelect = (key: keyof LifestyleResponses, value: string) => {
    setAnswers(prev => {
      const current = prev[key] ? prev[key].split(',').filter(Boolean) : [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated.join(',') };
    });
  };

  const answeredCount = Object.values(answers).filter(answer => answer !== '').length;

  const handleSubmit = async () => {
    try {
      const responses = {
        driving: answers.driving || undefined,
        screenTime: answers.screenTime || undefined,
        sports: answers.sports ? answers.sports.split(',') : undefined,
        hobbies: answers.hobbies ? answers.hobbies.split(',') : undefined,
        glareSensitivity: answers.glareSensitivity || undefined,
        outdoorHours: answers.outdoorHours || undefined,
        workEnvironment: answers.workEnvironment || undefined,
        existingPairs: answers.existingPairs ? Number(answers.existingPairs) : undefined,
        lastSunglassPurchase: answers.lastSunglassPurchase || undefined,
        primaryConcern: answers.primaryConcern || undefined,
      } as unknown as ApiLifestyleResponses;
      await saveQuestionnaire.mutateAsync({
        customerId: clientId,
        responses,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save lifestyle questionnaire');
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-xl">
        <View className="bg-bg-surface rounded-lg border border-border w-full max-w-[640px]" style={{ flex: 1, maxHeight: 720 }}>
          {/* Header */}
          <View className="p-lg border-b border-border">
            <Text className="text-heading-lg text-text-primary font-medium">
              Lifestyle Questionnaire
            </Text>
            <Text className="text-body-md text-text-secondary mt-xs">
              Multi-pair recommendations
            </Text>
            
            {/* Mode Toggle */}
            <View className="flex-row mt-md gap-sm">
              <Pressable
                onPress={() => setMode('staff')}
                className={`px-md py-sm rounded-md border min-h-[44px] justify-center ${
                  mode === 'staff' 
                    ? 'bg-bg-inverse border-bg-inverse' 
                    : 'bg-bg-surface border-border'
                }`}
              >
                <Text className={`text-body-sm ${
                  mode === 'staff' ? 'text-text-inverse' : 'text-text-primary'
                }`}>
                  Staff — one page
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('guided')}
                className={`px-md py-sm rounded-md border min-h-[44px] justify-center ${
                  mode === 'guided' 
                    ? 'bg-bg-inverse border-bg-inverse' 
                    : 'bg-bg-surface border-border'
                }`}
              >
                <Text className={`text-body-sm ${
                  mode === 'guided' ? 'text-text-inverse' : 'text-text-primary'
                }`}>
                  Hand to client — guided
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Body */}
          <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
            <View className="p-lg gap-xl">
              {questions.map((question, index) => {
                const isMulti = question.type === 'multi';
                const currentValues = isMulti 
                  ? (answers[question.key] ? answers[question.key].split(',').filter(Boolean) : [])
                  : [];

                return (
                  <View key={question.key}>
                    <Text className="text-heading-sm text-text-primary font-medium mb-md">
                      {index + 1}. {question.title}
                    </Text>
                    <View className="flex-row flex-wrap gap-sm">
                      {question.options.map((option) => {
                        const isSelected = isMulti
                          ? currentValues.includes(option)
                          : answers[question.key] === option;

                        return (
                          <Chip
                            key={option}
                            label={option}
                            selected={isSelected}
                            onPress={() => isMulti
                              ? handleMultiSelect(question.key, option)
                              : handleSingleSelect(question.key, option)
                            }
                          />
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-lg border-t border-border">
            <Text className="text-body-sm text-text-secondary mb-md">
              {answeredCount} of {questions.length} answered
            </Text>
            <View className="flex-row justify-end gap-md">
              <Button variant="ghost" onPress={onClose}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onPress={handleSubmit}
                loading={saveQuestionnaire.isPending}
              >
                Save Answers
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}