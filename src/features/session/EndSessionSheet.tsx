/**
 * EndSessionSheet — full-screen pageSheet modal for the 3-step end session flow.
 *
 * Flow:
 *   Step 1: Outcome — "How did it go?" with 4 large option cards
 *   Step 2: Summary email — toggle, language, preview
 *   Step 3: Internal notes — free text + quick tag chips
 *
 * Design: presentationStyle="pageSheet" (native iOS sheet, same as ConfiguratorSheet).
 * No transparent overlay — a real system-presented modal.
 */
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  ShoppingBag,
  Calendar,
  Star,
  DoorOpen,
  ChevronLeft,
  ScanLine,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from './useSessionStore';
import { useFittingStore } from '../fitting/useFittingStore';
import { useEndSession } from '@/src/api/useSessions';
import { useCreateBatchProductInteractions } from '@/src/api/useProductInteractions';
import { toast } from '@/src/ui/useToastStore';
import type { QuickTag } from '@/src/api/sessions.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type OutcomeTag = 'purchased' | 'booked_next_visit' | 'shortlist_emailed' | 'left_empty_handed';
type Language = 'en' | 'fr';

export interface EndSessionSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTCOME_OPTIONS: {
  key: OutcomeTag;
  label: string;
  description: string;
  icon: typeof ShoppingBag;
}[] = [
  {
    key: 'purchased',
    label: 'Purchased',
    description: 'Client bought frames today',
    icon: ShoppingBag,
  },
  {
    key: 'booked_next_visit',
    label: 'Booked next visit',
    description: 'Appointment scheduled',
    icon: Calendar,
  },
  {
    key: 'shortlist_emailed',
    label: 'Shortlist to review',
    description: 'Client will decide later',
    icon: Star,
  },
  {
    key: 'left_empty_handed',
    label: 'Left empty-handed',
    description: 'No next step agreed',
    icon: DoorOpen,
  },
];

const QUICK_TAGS: { key: QuickTag; label: string }[] = [
  { key: 'follow_up', label: 'Follow up' },
  { key: 'price_sensitive', label: 'Price sensitive' },
  { key: 'bring_spouse', label: 'Bring spouse' },
  { key: 'size_up', label: 'Size up' },
  { key: 'rx_needed', label: 'Rx needed' },
  { key: 'budget_concern', label: 'Budget concern' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function EndSessionSheet({ visible, onDismiss, onComplete }: EndSessionSheetProps) {
  const router = useRouter();

  // ─── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [outcome, setOutcome] = useState<OutcomeTag | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [sendSummary, setSendSummary] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [internalNotes, setInternalNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<QuickTag[]>([]);

  // ─── Store access ─────────────────────────────────────────────────────────
  const {
    activeClientId,
    activeClientName,
    sessionId,
    framesTried,
    endSession: resetSession,
  } = useSessionStore();

  const { photos, consentStatus, reset: resetFitting } = useFittingStore();
  const endSessionMutation = useEndSession();
  const batchInteractionsMutation = useCreateBatchProductInteractions();

  const isSubmitting = endSessionMutation.isPending || batchInteractionsMutation.isPending;
  const consentCaptured = consentStatus === 'granted';

  // Shortlisted frames for email preview
  const shortlistedFrames = useMemo(
    () => photos.filter((p) => p.verdict === 'loved' || p.verdict === 'liked'),
    [photos]
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    // Reset local state so re-open starts fresh
    setStep(1);
    setOutcome(null);
    setOrderRef('');
    setSendSummary(true);
    setLanguage('en');
    setInternalNotes('');
    setSelectedTags([]);
    onDismiss();
  }, [onDismiss]);

  const handleOutcomeSelect = useCallback((selected: OutcomeTag) => {
    setOutcome(selected);
    setStep(2);
  }, []);

  const handleTagToggle = useCallback((tag: QuickTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!activeClientId || !sessionId || !outcome) {
      toast.error('Missing data', 'Required session data is incomplete.');
      return;
    }

    try {
      // 1. Batch product interactions
      const interactions = framesTried
        .filter((f) => f.verdict)
        .map((f) => ({
          clientId: activeClientId,
          productId: f.productId,
          variantId: f.variantId,
          type: f.verdict === 'loved'
            ? ('loved' as const)
            : f.verdict === 'liked'
            ? ('liked' as const)
            : f.verdict === 'rejected'
            ? ('rejected' as const)
            : ('tried_on' as const),
          sessionId,
          notes: f.notes || undefined,
          metadata: { capturedAt: f.triedAt, photoCount: f.photoIds.length },
        }));

      if (interactions.length > 0) {
        await batchInteractionsMutation.mutateAsync(interactions);
      }

      // 2. End session API call
      await endSessionMutation.mutateAsync({
        sessionId,
        clientId: activeClientId,
        outcomeTag: outcome,
        sendSummary: sendSummary && consentCaptured,
        summaryLanguage: language,
        internalNotes: internalNotes.trim() || '',
        tags: selectedTags,
        orderRef: orderRef.trim() || undefined,
      });

      // 3. Reset stores
      resetSession();
      resetFitting();

      // 4. Navigate home
      router.replace('/(app)/home');
      onComplete();
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Save failed', 'Failed to save session. Please try again.');
    }
  }, [
    activeClientId, sessionId, outcome, framesTried, sendSummary,
    consentCaptured, language, internalNotes, selectedTags, orderRef,
    batchInteractionsMutation, endSessionMutation, resetSession,
    resetFitting, router, onComplete,
  ]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-color-bg-page">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <View className="flex-row items-center px-xl pt-xl pb-md border-b border-color-border">
          {/* Back button (steps 2-3) */}
          {step > 1 ? (
            <Pressable
              onPress={() => setStep((s) => (s - 1) as Step)}
              className="w-[44px] h-[44px] items-center justify-center mr-sm"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={24} color="#171717" />
            </Pressable>
          ) : (
            <View className="w-[44px]" />
          )}

          {/* Title + step indicator */}
          <View className="flex-1 items-center">
            <Text className="text-heading-lg text-color-text-primary">
              {step === 1 ? 'End session' : step === 2 ? 'Summary email' : 'Internal notes'}
            </Text>
            {/* Step dots */}
            <View className="flex-row items-center mt-sm gap-sm">
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  className={`h-1.5 rounded-full ${
                    s === step ? 'w-6 bg-color-brand' : s < step ? 'w-3 bg-color-success' : 'w-3 bg-color-bg-muted'
                  }`}
                />
              ))}
            </View>
          </View>

          {/* Close button */}
          <Pressable
            onPress={handleClose}
            className="w-[44px] h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Cancel and close"
          >
            <X size={24} color="#171717" />
          </Pressable>
        </View>

        {/* ─── Step Content ───────────────────────────────────────────── */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-xl"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <Step1Outcome
              outcome={outcome}
              orderRef={orderRef}
              onOutcomeSelect={handleOutcomeSelect}
              onOrderRefChange={setOrderRef}
            />
          )}
          {step === 2 && (
            <Step2Summary
              sendSummary={sendSummary}
              language={language}
              consentCaptured={consentCaptured}
              clientName={activeClientName ?? 'Client'}
              shortlistedFrames={shortlistedFrames}
              onSendSummaryChange={setSendSummary}
              onLanguageChange={setLanguage}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3Notes
              internalNotes={internalNotes}
              selectedTags={selectedTags}
              onNotesChange={setInternalNotes}
              onTagToggle={handleTagToggle}
            />
          )}
        </ScrollView>

        {/* ─── Bottom Action Bar ──────────────────────────────────────── */}
        {step === 3 && (
          <View className="px-xl py-md border-t border-color-border bg-color-bg-elevated">
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || !outcome}
              accessibilityRole="button"
              accessibilityLabel="Save and end session"
              className={`min-h-[52px] rounded-lg items-center justify-center ${
                isSubmitting ? 'bg-color-bg-muted' : 'bg-color-brand'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-body-lg font-semibold text-color-brand-text">
                  Save & end session
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Step 1: Outcome ──────────────────────────────────────────────────────────

interface Step1Props {
  outcome: OutcomeTag | null;
  orderRef: string;
  onOutcomeSelect: (outcome: OutcomeTag) => void;
  onOrderRefChange: (ref: string) => void;
}

function Step1Outcome({ outcome, orderRef, onOutcomeSelect, onOrderRefChange }: Step1Props) {
  return (
    <View>
      <Text className="text-display-sm text-color-text-primary text-center mb-sm">
        How did it go?
      </Text>
      <Text className="text-body-lg text-color-text-muted text-center mb-xl">
        Select an outcome to categorize this session
      </Text>

      {/* 2×2 grid of outcome cards */}
      <View className="flex-row flex-wrap justify-between">
        {OUTCOME_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          const isSelected = outcome === option.key;

          return (
            <Pressable
              key={option.key}
              onPress={() => onOutcomeSelect(option.key)}
              accessibilityRole="button"
              accessibilityLabel={`Session outcome: ${option.label}. ${option.description}`}
              accessibilityState={{ selected: isSelected }}
              className={`w-[48%] min-h-[140px] rounded-lg border-2 p-lg items-center justify-center mb-lg ${
                isSelected
                  ? 'border-color-brand bg-color-bg-surface'
                  : 'border-color-border bg-color-bg-surface'
              }`}
            >
              <IconComponent
                size={32}
                color={isSelected ? '#000EC7' : '#404040'}
              />
              <Text
                className={`text-body-lg font-semibold text-center mt-md ${
                  isSelected ? 'text-color-brand' : 'text-color-text-primary'
                }`}
              >
                {option.label}
              </Text>
              <Text className="text-body-sm text-color-text-muted text-center mt-xs">
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Order reference field — only visible after "Purchased" selected */}
      {outcome === 'purchased' && (
        <View className="mt-lg">
          <Text className="text-body-lg font-medium text-color-text-primary mb-sm">
            Link to order (optional)
          </Text>
          <View className="flex-row gap-sm">
            <TextInput
              value={orderRef}
              onChangeText={onOrderRefChange}
              placeholder="Order number or receipt..."
              placeholderTextColor="#737373"
              className="flex-1 bg-color-bg-surface border border-color-border rounded-lg px-md py-md text-body-lg text-color-text-primary min-h-[48px]"
            />
            <Pressable
              onPress={() => toast.info('Coming soon', 'Barcode scanning for order linking coming soon.')}
              accessibilityRole="button"
              accessibilityLabel="Scan receipt barcode"
              className="bg-color-brand rounded-lg min-h-[48px] min-w-[48px] items-center justify-center"
            >
              <ScanLine size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Step 2: Summary Email ────────────────────────────────────────────────────

interface Step2Props {
  sendSummary: boolean;
  language: Language;
  consentCaptured: boolean;
  clientName: string;
  shortlistedFrames: { productName?: string | null; verdict?: string | null }[];
  onSendSummaryChange: (value: boolean) => void;
  onLanguageChange: (lang: Language) => void;
  onNext: () => void;
}

function Step2Summary({
  sendSummary,
  language,
  consentCaptured,
  clientName,
  shortlistedFrames,
  onSendSummaryChange,
  onLanguageChange,
  onNext,
}: Step2Props) {
  return (
    <View>
      <Text className="text-display-sm text-color-text-primary text-center mb-xl">
        Summary email
      </Text>

      {/* Send toggle */}
      <View className="flex-row items-center justify-between mb-lg bg-color-bg-surface border border-color-border rounded-lg p-lg">
        <Text className="text-body-lg font-medium text-color-text-primary">Send summary email</Text>
        <Switch
          value={sendSummary}
          onValueChange={onSendSummaryChange}
          trackColor={{ false: '#D4D4D4', true: '#16A34A' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Consent warning */}
      {!consentCaptured && (
        <View className="mb-lg bg-color-bg-muted rounded-lg p-md">
          <Text className="text-body-sm text-color-text-muted">
            Photos not permitted — email will show frame names only
          </Text>
        </View>
      )}

      {/* Language selector */}
      {sendSummary && (
        <View className="flex-row items-center mb-xl gap-sm">
          <Text className="text-body-lg text-color-text-primary mr-md">Language:</Text>
          {(['en', 'fr'] as const).map((lang) => (
            <Pressable
              key={lang}
              onPress={() => onLanguageChange(lang)}
              accessibilityRole="button"
              accessibilityLabel={`Set language to ${lang === 'en' ? 'English' : 'French'}`}
              accessibilityState={{ selected: language === lang }}
              className={`px-lg py-sm rounded-lg min-h-[44px] min-w-[56px] items-center justify-center ${
                language === lang
                  ? 'bg-color-brand'
                  : 'border border-color-border bg-color-bg-surface'
              }`}
            >
              <Text
                className={`text-body-lg font-semibold ${
                  language === lang ? 'text-color-brand-text' : 'text-color-text-primary'
                }`}
              >
                {lang.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Email preview card */}
      <View className="bg-color-bg-surface border border-color-border rounded-lg p-lg mb-xl">
        <Text className="text-body-sm text-color-text-muted mb-sm font-medium uppercase tracking-wide">
          Preview
        </Text>

        {sendSummary ? (
          <View>
            <Text className="text-body-sm text-color-text-muted mb-xs">
              To: {clientName}
            </Text>
            <Text className="text-body-sm text-color-text-muted mb-md">
              Subject: Your fitting session summary
            </Text>

            {shortlistedFrames.length > 0 ? (
              <View>
                <Text className="text-body-lg text-color-text-primary mb-sm">
                  {language === 'en' ? 'Frames you loved:' : 'Montures que vous avez aimées:'}
                </Text>
                {shortlistedFrames.slice(0, 3).map((photo, idx) => (
                  <Text key={idx} className="text-body-sm text-color-text-secondary">
                    • {photo.productName || 'Frame'} — {photo.verdict}
                  </Text>
                ))}
                {shortlistedFrames.length > 3 && (
                  <Text className="text-body-sm text-color-text-muted mt-xs">
                    + {shortlistedFrames.length - 3} more
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-body-lg text-color-text-muted">
                {language === 'en'
                  ? 'Thank you for visiting us today.'
                  : "Merci de votre visite aujourd'hui."}
              </Text>
            )}
          </View>
        ) : (
          <Text className="text-body-lg text-color-text-muted text-center py-lg">
            No email will be sent
          </Text>
        )}
      </View>

      {/* Next button */}
      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Continue to notes"
        className="bg-color-brand rounded-lg min-h-[52px] items-center justify-center"
      >
        <Text className="text-body-lg font-semibold text-color-brand-text">Next</Text>
      </Pressable>
    </View>
  );
}

// ─── Step 3: Internal Notes ───────────────────────────────────────────────────

interface Step3Props {
  internalNotes: string;
  selectedTags: QuickTag[];
  onNotesChange: (notes: string) => void;
  onTagToggle: (tag: QuickTag) => void;
}

function Step3Notes({ internalNotes, selectedTags, onNotesChange, onTagToggle }: Step3Props) {
  return (
    <View>
      <Text className="text-display-sm text-color-text-primary text-center mb-xl">
        Internal notes
      </Text>

      {/* Notes textarea */}
      <View className="mb-xl">
        <Text className="text-body-lg font-medium text-color-text-primary mb-sm">
          Session notes (staff only)
        </Text>
        <TextInput
          value={internalNotes}
          onChangeText={onNotesChange}
          placeholder="Add notes about this session..."
          placeholderTextColor="#737373"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="bg-color-bg-surface border border-color-border rounded-lg p-lg text-body-lg text-color-text-primary min-h-[140px]"
        />
      </View>

      {/* Quick tag chips */}
      <View>
        <Text className="text-body-lg font-medium text-color-text-primary mb-md">
          Quick tags
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {QUICK_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.key);
            return (
              <Pressable
                key={tag.key}
                onPress={() => onTagToggle(tag.key)}
                accessibilityRole="button"
                accessibilityLabel={`Tag: ${tag.label}`}
                accessibilityState={{ selected: isSelected }}
                className={`rounded-lg px-lg py-sm min-h-[44px] items-center justify-center ${
                  isSelected
                    ? 'bg-color-brand'
                    : 'border border-color-border bg-color-bg-surface'
                }`}
              >
                <Text
                  className={`text-body-lg font-medium ${
                    isSelected ? 'text-color-brand-text' : 'text-color-text-primary'
                  }`}
                >
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
