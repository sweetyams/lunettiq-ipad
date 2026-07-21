/**
 * LifestyleQuestionnaireSheet — guided questionnaire for multi-pair recommendations.
 *
 * Questions are predefined (multi-pair module doesn't serve dynamic questions yet).
 * Answers saved via POST /api/admin/multi-pair/questionnaires.
 */
import { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { X, ChevronRight, Check } from 'lucide-react-native';
import { useSaveQuestionnaire } from '@/src/api/useMultiPair';
import { toast } from '@/src/ui/useToastStore';

// ─── Questions ───────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  type: 'single' | 'multi';
  options: string[];
}

const LIFESTYLE_QUESTIONS: Question[] = [
  {
    id: 'primary_use',
    text: 'What do you primarily use your glasses for?',
    type: 'multi',
    options: ['Office/computer work', 'Driving', 'Reading', 'Sports/outdoor', 'All-day wear', 'Social/evening'],
  },
  {
    id: 'screen_hours',
    text: 'How many hours per day do you spend on screens?',
    type: 'single',
    options: ['Less than 2', '2–4 hours', '4–8 hours', '8+ hours'],
  },
  {
    id: 'outdoor_activities',
    text: 'Which outdoor activities do you enjoy?',
    type: 'multi',
    options: ['Cycling', 'Running', 'Golf', 'Water sports', 'Skiing', 'Hiking', 'None regularly'],
  },
  {
    id: 'driving_frequency',
    text: 'How often do you drive?',
    type: 'single',
    options: ['Daily commute', 'Few times a week', 'Weekends only', 'Rarely'],
  },
  {
    id: 'light_sensitivity',
    text: 'Do you experience light sensitivity?',
    type: 'single',
    options: ['Very sensitive', 'Somewhat', 'Not particularly', 'Only in bright sun'],
  },
  {
    id: 'style_preference',
    text: 'What frame styles appeal to you for a second pair?',
    type: 'multi',
    options: ['Bold/statement', 'Classic/timeless', 'Sporty/technical', 'Lightweight/minimal', 'Trendy/fashion-forward'],
  },
  {
    id: 'budget_range',
    text: 'What budget range are you comfortable with for an additional pair?',
    type: 'single',
    options: ['Under $200', '$200–$400', '$400–$600', '$600+', 'Insurance covers it'],
  },
];

// ─── Component ───────────────────────────────────────────────

interface LifestyleQuestionnaireSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function LifestyleQuestionnaireSheet({ clientId, visible, onClose }: LifestyleQuestionnaireSheetProps) {
  const saveQuestionnaire = useSaveQuestionnaire();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const currentQuestion = LIFESTYLE_QUESTIONS[currentIndex]!;
  const totalQuestions = LIFESTYLE_QUESTIONS.length;
  const isLast = currentIndex === totalQuestions - 1;

  const handleSelect = useCallback((option: string) => {
    setAnswers((prev) => {
      const q = LIFESTYLE_QUESTIONS[currentIndex]!;
      if (q.type === 'single') {
        return { ...prev, [q.id]: option };
      }
      const existing = (prev[q.id] as string[]) ?? [];
      const updated = existing.includes(option)
        ? existing.filter((o) => o !== option)
        : [...existing, option];
      return { ...prev, [q.id]: updated };
    });
  }, [currentIndex]);

  const isOptionSelected = (option: string): boolean => {
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.includes(option);
    return answer === option;
  };

  const canAdvance = (): boolean => {
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  };

  const handleNext = useCallback(() => {
    if (isLast) {
      handleSubmit();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLast]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    try {
      const formattedAnswers = LIFESTYLE_QUESTIONS.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] ?? '',
      }));

      await saveQuestionnaire.mutateAsync({
        customerId: clientId,
        answers: formattedAnswers,
      });

      toast.success('Questionnaire saved', 'Multi-pair recommendations unlocked');
      setCurrentIndex(0);
      setAnswers({});
      onClose();
    } catch {
      toast.error('Failed to save', 'Please try again');
    }
  }, [answers, clientId, saveQuestionnaire, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg-page">
        {/* Header */}
        <View className="flex-row items-center justify-between px-xl pt-xl pb-md border-b border-border">
          <View>
            <Text className="text-displayMd text-text-primary">Lifestyle</Text>
            <Text className="text-caption text-text-muted mt-xs">
              {currentIndex + 1} of {totalQuestions}
            </Text>
          </View>
          <Pressable onPress={onClose} className="w-11 h-11 items-center justify-center rounded-full bg-bg-muted" accessibilityRole="button" accessibilityLabel="Close">
            <X size={20} color="#737373" />
          </Pressable>
        </View>

        {/* Progress */}
        <View className="h-1 bg-bg-muted">
          <View className="h-1 bg-accent" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
        </View>

        {/* Question */}
        <ScrollView className="flex-1 px-xl py-xl" showsVerticalScrollIndicator={false}>
          <Text className="text-displayMd text-text-primary mb-lg">{currentQuestion.text}</Text>
          {currentQuestion.type === 'multi' && (
            <Text className="text-caption text-text-muted mb-md">Select all that apply</Text>
          )}

          <View className="gap-sm">
            {currentQuestion.options.map((option) => {
              const selected = isOptionSelected(option);
              return (
                <Pressable
                  key={option}
                  onPress={() => handleSelect(option)}
                  className={`flex-row items-center px-lg py-md rounded-lg border min-h-[52px] ${
                    selected ? 'border-accent bg-accent/5' : 'border-border bg-bg-elevated'
                  }`}
                  accessibilityRole={currentQuestion.type === 'single' ? 'radio' : 'checkbox'}
                  accessibilityState={{ selected }}
                  accessibilityLabel={option}
                >
                  <Text className={`text-body flex-1 ${selected ? 'text-text-primary font-medium' : 'text-text-primary'}`}>
                    {option}
                  </Text>
                  {selected && <Check size={18} color="#023891" />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="flex-row items-center px-xl py-lg border-t border-border gap-md">
          {currentIndex > 0 && (
            <Pressable onPress={handleBack} className="border border-border rounded-md px-lg py-md min-h-[44px] items-center justify-center" accessibilityRole="button" accessibilityLabel="Back">
              <Text className="text-body text-text-primary">Back</Text>
            </Pressable>
          )}
          <View className="flex-1" />
          <Pressable
            onPress={handleNext}
            disabled={!canAdvance() || saveQuestionnaire.isPending}
            className="bg-accent rounded-md px-xl py-md min-h-[44px] items-center justify-center flex-row"
            style={{ opacity: canAdvance() ? 1 : 0.4 }}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Submit' : 'Next'}
          >
            <Text className="text-accent-text text-bodyStrong mr-xs">
              {saveQuestionnaire.isPending ? 'Saving...' : isLast ? 'Submit' : 'Next'}
            </Text>
            {!isLast && <ChevronRight size={16} color="#FFFFFF" />}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
