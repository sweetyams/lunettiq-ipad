import { useState } from 'react';
import { View, Text, Pressable, TextInput, Switch, Alert } from 'react-native';
import { ShoppingBag, Calendar, Star, DoorOpen, ChevronLeft } from 'lucide-react-native';
import { useSessionStore } from './useSessionStore';
import { useCreateInteraction } from '@/src/api/useInteractions';

type Outcome = 'purchased' | 'booked_next' | 'shortlist' | 'empty_handed';
type Step = 1 | 2 | 3;

interface EndSessionFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function EndSessionFlow({ onComplete, onCancel }: EndSessionFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [language, setLanguage] = useState<'EN' | 'FR'>('EN');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { activeClientId, sessionId, reset } = useSessionStore();
  const createInteraction = useCreateInteraction();

  const quickTags = ['follow up', 'price sensitive', 'bring spouse', 'size up'];

  const outcomeOptions = [
    { key: 'purchased' as const, label: 'Purchased', icon: ShoppingBag },
    { key: 'booked_next' as const, label: 'Booked next visit', icon: Calendar },
    { key: 'shortlist' as const, label: 'Shortlist to review', icon: Star },
    { key: 'empty_handed' as const, label: 'Left empty-handed', icon: DoorOpen },
  ];

  const handleOutcomeSelect = (selectedOutcome: Outcome) => {
    setOutcome(selectedOutcome);
    setStep(2);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleComplete = async () => {
    if (!activeClientId || !outcome) {
      Alert.alert('Error', 'Missing required session data');
      return;
    }

    try {
      // Create interaction timeline entry
      await createInteraction.mutateAsync({
        shopifyCustomerId: activeClientId,
        type: 'session_completed',
        direction: 'internal',
        subject: `Session completed: ${outcome.replace('_', ' ')}`,
        body: notes.trim() || undefined,
        metadata: {
          sessionId: sessionId || undefined,
          outcome,
          sendEmail,
          emailLanguage: language,
          tags: selectedTags,
        },
      });

      // Reset session state
      reset();
      
      // Complete the flow
      onComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-center items-center mb-xl">
      {[1, 2, 3].map((stepNum) => (
        <View
          key={stepNum}
          testID="step-dot"
          className={`w-3 h-3 rounded-full mx-1 ${
            stepNum === step ? 'bg-navy' : 'bg-warmGrey'
          }`}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text className="text-displayMd font-bold text-charcoal text-center mb-xl">
        How did it go?
      </Text>
      
      <View className="flex-row flex-wrap justify-between">
        {outcomeOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = outcome === option.key;
          
          return (
            <Pressable
              key={option.key}
              onPress={() => handleOutcomeSelect(option.key)}
              className={`bg-white rounded-lg p-lg items-center justify-center min-h-[120px] w-[48%] mb-md ${
                isSelected 
                  ? 'border-2 border-navy bg-navy/5' 
                  : 'border border-warmGrey'
              }`}
            >
              <IconComponent 
                size={32} 
                color={isSelected ? '#0A153D' : '#6B6B6B'} 
                className="mb-sm"
              />
              <Text className={`text-body font-medium text-center ${
                isSelected ? 'text-navy' : 'text-charcoal'
              }`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <View className="flex-row items-center mb-xl">
        <Pressable 
          onPress={() => setStep(1)}
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="w-11 h-11 items-center justify-center"
        >
          <ChevronLeft size={24} color="#0A153D" />
        </Pressable>
        <Text className="text-displayMd font-bold text-charcoal flex-1 text-center mr-11">
          Client summary
        </Text>
      </View>

      <View className="mb-lg">
        <View className="flex-row items-center justify-between mb-md">
          <Text className="text-body font-medium text-charcoal">Send summary email</Text>
          <Switch
            value={sendEmail}
            onValueChange={setSendEmail}
            trackColor={{ false: '#E8E4DE', true: '#005D23' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {sendEmail && (
          <View className="flex-row mb-lg">
            <Text className="text-body text-charcoal mr-md">Language:</Text>
            <View className="flex-row">
              {['EN', 'FR'].map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang as 'EN' | 'FR')}
                  className={`px-md py-sm rounded-md mr-sm min-w-[44px] min-h-[44px] items-center justify-center ${
                    language === lang
                      ? 'bg-navy'
                      : 'border border-warmGrey bg-white'
                  }`}
                >
                  <Text className={`text-body font-medium ${
                    language === lang ? 'text-white' : 'text-charcoal'
                  }`}>
                    {lang}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <View className="bg-white border border-warmGrey rounded-lg p-lg mb-xl min-h-[120px] items-center justify-center">
        <Text className="text-body text-midGrey text-center">
          Summary preview will appear here
        </Text>
      </View>

      <Pressable
        onPress={() => setStep(3)}
        className="bg-navy rounded-md py-md px-lg items-center min-h-[44px] justify-center"
      >
        <Text className="text-body font-medium text-white">Next</Text>
      </Pressable>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <View className="flex-row items-center mb-xl">
        <Pressable 
          onPress={() => setStep(2)}
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="w-11 h-11 items-center justify-center"
        >
          <ChevronLeft size={24} color="#0A153D" />
        </Pressable>
        <Text className="text-displayMd font-bold text-charcoal flex-1 text-center mr-11">
          Internal notes
        </Text>
      </View>

      <View className="mb-lg">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes about this session..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-white border border-warmGrey rounded-lg p-md text-body text-charcoal min-h-[100px]"
        />
      </View>

      <View className="mb-xl">
        <Text className="text-body font-medium text-charcoal mb-md">Quick tags</Text>
        <View className="flex-row flex-wrap">
          {quickTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => handleTagToggle(tag)}
                className={`rounded-md px-md py-sm mr-sm mb-sm min-h-[44px] items-center justify-center ${
                  isSelected
                    ? 'bg-navy'
                    : 'border border-warmGrey bg-white'
                }`}
              >
                <Text className={`text-body font-medium ${
                  isSelected ? 'text-white' : 'text-charcoal'
                }`}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={handleComplete}
        disabled={createInteraction.isPending}
        className="bg-green rounded-md py-md px-lg items-center min-h-[44px] justify-center"
      >
        <Text className="text-body font-medium text-white">
          {createInteraction.isPending ? 'Saving...' : 'Save & close'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 p-2xl">
      {renderStepIndicator()}
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </View>
  );
}