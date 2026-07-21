import { useState } from 'react';
import { View, Text, Pressable, TextInput, Switch, Alert, ScrollView } from 'react-native';
import { ShoppingBag, Calendar, Star, DoorOpen, ChevronLeft, ScanLine } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from './useSessionStore';
import { useFittingStore } from '../fitting/useFittingStore';
import { useCreateInteraction } from '@/src/api/useInteractions';
import { useCreateBatchProductInteractions } from '@/src/api/useProductInteractions';
import type { QuickTag } from '@/src/api/sessions.types';

type Step = 1 | 2 | 3;
type OutcomeTag = 'purchased' | 'booked_next_visit' | 'shortlist_emailed' | 'left_empty_handed';
type Language = 'en' | 'fr';

interface EndSessionFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function EndSessionFlow({ onComplete, onCancel }: EndSessionFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [outcome, setOutcome] = useState<OutcomeTag | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [sendSummary, setSendSummary] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [internalNotes, setInternalNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<QuickTag[]>([]);

  const { 
    activeClientId, 
    activeClientName,
    sessionId, 
    framesTried,
    endSession: resetSession
  } = useSessionStore();
  
  const { 
    photos, 
    consentStatus,
    reset: resetFitting 
  } = useFittingStore();

  const endSessionMutation = useCreateInteraction(); // Use existing interaction API
  const createInteractionMutation = useCreateInteraction();
  const createProductInteractionsMutation = useCreateBatchProductInteractions();

  // Quick tag options with proper typing
  const quickTags: { key: QuickTag; label: string }[] = [
    { key: 'follow_up', label: 'Follow up' },
    { key: 'price_sensitive', label: 'Price sensitive' },
    { key: 'bring_spouse', label: 'Bring spouse' },
    { key: 'size_up', label: 'Size up' },
    { key: 'rx_needed', label: 'Rx needed' },
    { key: 'budget_concern', label: 'Budget concern' },
  ];

  // Outcome options with proper icons and colors
  const outcomeOptions = [
    { 
      key: 'purchased' as const, 
      label: 'Purchased', 
      icon: ShoppingBag,
      color: '#005D23' // green accent
    },
    { 
      key: 'booked_next_visit' as const, 
      label: 'Booked next visit', 
      icon: Calendar,
      color: '#1D1F21' // brand
    },
    { 
      key: 'shortlist_emailed' as const, 
      label: 'Shortlist to review', 
      icon: Star,
      color: '#1D1F21' // brand
    },
    { 
      key: 'left_empty_handed' as const, 
      label: 'Left empty-handed', 
      icon: DoorOpen,
      color: '#1D1F21' // brand
    },
  ];

  // Get shortlisted frames from photos
  const shortlistedFrames = photos.filter(photo => 
    photo.verdict === 'loved' || photo.verdict === 'liked'
  );

  // Determine if consent was captured for email logic
  const consentCaptured = consentStatus === 'granted';

  const handleOutcomeSelect = (selectedOutcome: OutcomeTag) => {
    setOutcome(selectedOutcome);
    // Auto-advance to step 2 for single-tap flow
    setStep(2);
  };

  const handleTagToggle = (tag: QuickTag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleBarcodeScan = () => {
    // TODO: Implement barcode scanning for order linking
    Alert.alert('Barcode Scan', 'Barcode scanning not yet implemented');
  };

  const handleComplete = async () => {
    if (!activeClientId || !sessionId || !outcome) {
      Alert.alert('Error', 'Missing required session data');
      return;
    }

    try {
      // 1. Create main session completion interaction
      await createInteractionMutation.mutateAsync({
        clientId: activeClientId,
        type: 'session_completed',
        notes: internalNotes.trim() || undefined,
        metadata: {
          sessionId,
          outcome,
          framesTried: framesTried.length,
          photosTaken: photos.length,
          sendSummary: sendSummary && consentCaptured,
          summaryLanguage: language,
          tags: selectedTags,
          orderRef: orderRef.trim() || undefined,
        },
      });

      // 2. Create product interactions for each frame with verdict
      const productInteractions = framesTried
        .filter(frame => frame.verdict)
        .map(frame => ({
          clientId: activeClientId,
          productId: frame.productId,
          variantId: frame.variantId,
          type: frame.verdict === 'loved' 
            ? 'loved' as const
            : frame.verdict === 'liked' 
            ? 'liked' as const 
            : frame.verdict === 'rejected'
            ? 'rejected' as const
            : 'tried_on' as const,
          sessionId,
          notes: frame.notes || undefined,
          metadata: {
            capturedAt: frame.triedAt,
            photoCount: frame.photoIds.length,
          },
        }));

      if (productInteractions.length > 0) {
        await createProductInteractionsMutation.mutateAsync(productInteractions);
      }

      // 3. Reset session and fitting state
      resetSession();
      resetFitting();

      // 4. Navigate back to home with success
      router.replace('/(app)/home');
      
      // Complete the flow
      onComplete();
      
    } catch (error) {
      console.error('Failed to end session:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-center items-center mb-xl">
      {[1, 2, 3].map((stepNum) => (
        <View
          key={stepNum}
          className={`w-3 h-3 rounded-full mx-1 ${
            stepNum === step ? 'bg-brand' : 'bg-border'
          }`}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="flex-1">
      <Text className="text-displayMd font-bold text-text-primary text-center mb-xl">
        How did it go?
      </Text>
      
      {/* 2x2 Grid of outcome cards */}
      <View className="flex-row flex-wrap justify-between">
        {outcomeOptions.map((option) => {
          const IconComponent = option.icon;
          
          return (
            <Pressable
              key={option.key}
              onPress={() => handleOutcomeSelect(option.key)}
              className="bg-bg-elevated rounded-lg border border-border p-lg items-center justify-center min-h-[120px] w-[48%] mb-md"
              style={{ 
                borderColor: option.key === 'purchased' ? '#005D23' : '#E8E4DE',
                borderWidth: option.key === 'purchased' ? 2 : 1
              }}
            >
              <IconComponent 
                size={32} 
                color={option.color}
                style={{ marginBottom: 8 }}
              />
              <Text className="text-body font-medium text-center text-text-primary">
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Show order reference field if purchased is selected */}
      {outcome === 'purchased' && (
        <View className="mt-lg">
          <Text className="text-body font-medium text-text-primary mb-sm">
            Link to order (optional)
          </Text>
          <View className="flex-row">
            <TextInput
              value={orderRef}
              onChangeText={setOrderRef}
              placeholder="Order number or receipt..."
              className="flex-1 bg-bg-elevated border border-border rounded-md p-md text-body text-text-primary min-h-[44px]"
            />
            <Pressable
              onPress={handleBarcodeScan}
              className="ml-sm bg-brand rounded-md p-md min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <ScanLine size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center mb-xl">
        <Pressable 
          onPress={() => setStep(1)}
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="w-11 h-11 items-center justify-center"
        >
          <ChevronLeft size={24} color="#0A153D" />
        </Pressable>
        <Text className="text-displayMd font-bold text-text-primary flex-1 text-center mr-11">
          Summary email
        </Text>
      </View>

      {/* Send summary toggle */}
      <View className="mb-lg">
        <View className="flex-row items-center justify-between mb-md">
          <Text className="text-body font-medium text-text-primary">Send summary email</Text>
          <Switch
            value={sendSummary}
            onValueChange={setSendSummary}
            trackColor={{ false: '#E8E4DE', true: '#005D23' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Show consent warning if declined */}
        {!consentCaptured && (
          <Text className="text-caption text-text-muted mb-md">
            Photos not permitted — email will show frame names only
          </Text>
        )}

        {/* Language selector */}
        {sendSummary && (
          <View className="flex-row items-center mb-lg">
            <Text className="text-body text-text-primary mr-md">Language:</Text>
            <View className="flex-row">
              {[
                { key: 'en' as const, label: 'EN' },
                { key: 'fr' as const, label: 'FR' }
              ].map((lang) => (
                <Pressable
                  key={lang.key}
                  onPress={() => setLanguage(lang.key)}
                  className={`px-md py-sm rounded-md mr-sm min-w-[44px] min-h-[44px] items-center justify-center ${
                    language === lang.key
                      ? 'bg-brand'
                      : 'border border-border bg-bg-elevated'
                  }`}
                >
                  <Text className={`text-body font-medium ${
                    language === lang.key ? 'text-text-inverse' : 'text-text-primary'
                  }`}>
                    {lang.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Email preview */}
      <View className="bg-bg-elevated border border-border rounded-lg p-lg mb-xl min-h-[200px]">
        <Text className="text-body font-medium text-text-primary mb-md">
          Email preview
        </Text>
        
        {sendSummary ? (
          <View>
            <Text className="text-caption text-text-muted mb-sm">
              To: {activeClientName}
            </Text>
            <Text className="text-caption text-text-muted mb-sm">
              Subject: Your fitting session summary
            </Text>
            
            {shortlistedFrames.length > 0 ? (
              <View className="mt-md">
                <Text className="text-body text-text-primary mb-sm">
                  Frames you {language === 'en' ? 'loved' : 'avez aimées'}:
                </Text>
                {shortlistedFrames.slice(0, 3).map((photo, idx) => (
                  <Text key={idx} className="text-caption text-text-muted">
                    • {photo.productName || 'Frame'} - {photo.verdict}
                  </Text>
                ))}
                {shortlistedFrames.length > 3 && (
                  <Text className="text-caption text-text-muted">
                    ... and {shortlistedFrames.length - 3} more
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-body text-text-muted mt-md">
                {language === 'en' 
                  ? 'Thank you for visiting us today.'
                  : 'Merci de votre visite aujourd\'hui.'
                }
              </Text>
            )}
          </View>
        ) : (
          <Text className="text-body text-text-muted text-center">
            No email will be sent
          </Text>
        )}
      </View>

      {/* Next button */}
      <Pressable
        onPress={() => setStep(3)}
        className="bg-brand rounded-md py-md px-lg items-center min-h-[44px] justify-center"
      >
        <Text className="text-body font-medium text-text-inverse">Next</Text>
      </Pressable>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center mb-xl">
        <Pressable 
          onPress={() => setStep(2)}
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="w-11 h-11 items-center justify-center"
        >
          <ChevronLeft size={24} color="#0A153D" />
        </Pressable>
        <Text className="text-displayMd font-bold text-text-primary flex-1 text-center mr-11">
          Internal notes
        </Text>
      </View>

      {/* Notes text area */}
      <View className="mb-lg">
        <TextInput
          value={internalNotes}
          onChangeText={setInternalNotes}
          placeholder="Add notes about this session..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-bg-elevated border border-border rounded-lg p-md text-body text-text-primary min-h-[100px]"
        />
      </View>

      {/* Quick tag chips */}
      <View className="mb-xl">
        <Text className="text-body font-medium text-text-primary mb-md">Quick tags</Text>
        <View className="flex-row flex-wrap">
          {quickTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.key);
            return (
              <Pressable
                key={tag.key}
                onPress={() => handleTagToggle(tag.key)}
                className={`rounded-md px-md py-sm mr-sm mb-sm min-h-[44px] items-center justify-center ${
                  isSelected
                    ? 'bg-brand'
                    : 'border border-border bg-bg-elevated'
                }`}
              >
                <Text className={`text-body font-medium ${
                  isSelected ? 'text-text-inverse' : 'text-text-primary'
                }`}>
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Save button with loading state */}
      <Pressable
        onPress={handleComplete}
        disabled={
          createInteractionMutation.isPending ||
          createProductInteractionsMutation.isPending
        }
        className="bg-accent rounded-md py-md px-lg items-center min-h-[44px] justify-center opacity-100"
        style={{ 
          opacity: (
            createInteractionMutation.isPending ||
            createProductInteractionsMutation.isPending
          ) ? 0.6 : 1
        }}
      >
        <Text className="text-body font-medium text-text-inverse">
          {(
            createInteractionMutation.isPending ||
            createProductInteractionsMutation.isPending
          ) ? 'Saving...' : 'Save & end session'}
        </Text>
      </Pressable>
    </ScrollView>
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