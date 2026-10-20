/**
 * EndSessionSheet — "End visit": one page, outcome first (Found UI selectable
 * tiles), then order number / follow-up email / notes. Saves the visit, frames
 * and verdicts to Foundry; "Booked next visit" opens the booking sheet after.
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { ShoppingBag, Calendar, Star, DoorOpen } from 'lucide-react-native';
import { Sheet, Field, TextField, ChoiceChips, Badge, kitColors } from '@/src/ui/kit';
import { useSessionStore } from './useSessionStore';
import { useFittingStore } from '../fitting/useFittingStore';
import { useEffectiveLocationId } from '@/src/features/tenant/useDeviceLocationStore';
import { toServerFramesTried, unsyncedFrames, verdictToInteractionType } from './sessionSync';
import { CreateAppointmentSheet } from '@/src/features/appointments/CreateAppointmentSheet';
import { toast } from '@/src/ui/useToastStore';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { newClose, type EndPayload } from './visitOutbox';
import { useVisitOutbox, flushClose } from './VisitOutboxWorker';
import type { QuickTag } from '@/src/api/sessions.types';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  // ─── State ────────────────────────────────────────────────────────────────
  const [outcome, setOutcome] = useState<OutcomeTag | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [sendSummary, setSendSummary] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [internalNotes, setInternalNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<QuickTag[]>([]);
  const [showFollowUpSheet, setShowFollowUpSheet] = useState(false);

  // ─── Session data capture (before reset) ─────────────────────────────────
  const savedClientIdRef = useRef<string | null>(null);
  const savedSessionIdRef = useRef<string | null>(null);

  // ─── Store access ─────────────────────────────────────────────────────────
  const {
    activeClientId,
    activeClientName,
    sessionId,
    appointmentId,
    framesTried,
    endSession: resetSession,
  } = useSessionStore();
  const locationId = useEffectiveLocationId();

  const { photos, consentStatus, reset: resetFitting } = useFittingStore();
  const isOnline = useSyncStore((st) => st.isOnline);
  const [isSubmitting, setSubmitting] = useState(false);

  /**
   * Save the whole close to the outbox first (survives offline / app restarts), clear the
   * visit, then try to send it now. Returns false only if nothing could be saved.
   */
  const closeVisit = useCallback(async (end: EndPayload): Promise<boolean> => {
    if (!activeClientId || !sessionId) return false;
    const job = newClose({
      clientId: activeClientId,
      sessionId,
      locationId,
      appointmentId,
      framesTried: toServerFramesTried(framesTried),
      triedOn: unsyncedFrames(framesTried).map((f) => ({
        productId: f.productId, variantId: f.variantId, type: 'tried_on' as const, metadata: { triedAt: f.triedAt },
      })),
      verdicts: framesTried.flatMap((f) => {
        const type = verdictToInteractionType(f.verdict);
        return type ? [{ productId: f.productId, variantId: f.variantId, type, notes: f.notes || undefined, metadata: { verdict: f.verdict, photoCount: f.photoIds.length } }] : [];
      }),
      end,
    });
    useVisitOutbox.getState().add(job);
    resetSession();
    resetFitting();
    if (!isOnline) {
      toast.info('Visit saved on this iPad', 'It syncs to Foundry when the iPad is back online.');
      return true;
    }
    setSubmitting(true);
    try {
      const result = await flushClose(job);
      if (result.step !== 'done') toast.info('Visit saved on this iPad', 'Foundry didn’t answer; it retries automatically.');
    } finally {
      setSubmitting(false);
    }
    return true;
  }, [activeClientId, sessionId, locationId, appointmentId, framesTried, isOnline, resetSession, resetFitting]);
  const consentCaptured = consentStatus === 'granted';

  // Frames the client loved: what the follow-up email is about.
  const lovedFrames = useMemo(
    () => framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked'),
    [framesTried]
  );
  const photoCount = photos.length;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    // Reset local state so re-open starts fresh
    setOutcome(null);
    setOrderRef('');
    setSendSummary(true);
    setLanguage('en');
    setInternalNotes('');
    setSelectedTags([]);
    setShowFollowUpSheet(false);
    savedClientIdRef.current = null;
    savedSessionIdRef.current = null;
    onDismiss();
  }, [onDismiss]);

  /** Quick end — skips email and notes steps, ends session immediately */
  const handleQuickEnd = useCallback(async () => {
    if (!activeClientId || !sessionId) {
      toast.error('Missing data', 'No active session found.');
      return;
    }

    if (await closeVisit({ outcome: 'no_match', sendSummary: false, tags: [] })) onComplete();
  }, [activeClientId, sessionId, closeVisit, onComplete]);


  const handleSubmit = useCallback(async () => {
    if (!activeClientId || !sessionId || !outcome) {
      toast.error('Missing data', 'Required session data is incomplete.');
      return;
    }

    // ─── Capture session data BEFORE reset ───────────────────────────────────
    savedClientIdRef.current = activeClientId;
    savedSessionIdRef.current = sessionId;

    const outcomeMap: Record<string, EndPayload['outcome']> = {
      purchased: 'purchased',
      booked_next_visit: 'needs_followup',
      shortlist_emailed: 'saved_for_later',
      left_empty_handed: 'no_match',
    };
    const saved = await closeVisit({
      outcome: outcomeMap[outcome] ?? 'no_match',
      notes: internalNotes.trim() || undefined,
      sendSummary: sendSummary && consentCaptured,
      summaryLanguage: language,
      tags: selectedTags,
      orderRef: orderRef.trim() || undefined,
    });
    if (!saved) {
      toast.error('Visit not saved', 'No active visit found.');
      return;
    }
    // Booking the next visit needs Foundry (free times); offline, book it later from the profile.
    if (outcome === 'booked_next_visit' && isOnline) setShowFollowUpSheet(true);
    else onComplete();
  }, [
    activeClientId, sessionId, outcome, sendSummary, consentCaptured, language, internalNotes,
    selectedTags, orderRef, closeVisit, isOnline, onComplete,
  ]);

  const handleFollowUpSheetClose = useCallback(() => {
    setShowFollowUpSheet(false);
    // Complete the end-session flow now that follow-up is handled
    onComplete();
  }, [onComplete]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const tried = framesTried.length;
  const summary = [
    `${tried} ${tried === 1 ? 'frame' : 'frames'} tried`,
    lovedFrames.length ? `${lovedFrames.length} loved` : null,
    photoCount ? `${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <Sheet
        visible={visible && !showFollowUpSheet}
        onClose={handleClose}
        wide
        title={`End visit${activeClientName ? ` with ${activeClientName}` : ''}`}
        subtitle={summary}
        footerNote={outcome === 'left_empty_handed' && lovedFrames.length ? 'Loved frames start a follow-up in Follow-ups.' : undefined}
        secondary={{ label: 'Keep visit open', onPress: handleClose }}
        primary={{
          label: outcome === 'booked_next_visit' ? 'Save and book' : 'Save visit',
          onPress: handleSubmit,
          disabled: !outcome,
          loading: isSubmitting,
        }}
      >
        <View className="gap-[24px]">
          <Field label="How did it go?" required>
            <View className="flex-row flex-wrap gap-[12px]">
              {OUTCOME_OPTIONS.map((o) => {
                const on = outcome === o.key;
                const Icon = o.icon;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => setOutcome(o.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${o.label}. ${o.description}`}
                    className="w-[48.5%]"
                  >
                    {({ pressed }) => (
                      <View className={`flex-row items-center gap-[14px] p-[16px] rounded-lg border ${on ? 'border-accent bg-bg-page' : pressed ? 'border-border bg-bg-subtle' : 'border-border bg-bg-page'}`}
                        style={on ? { borderWidth: 2, padding: 15 } : undefined}>
                        <View className={`w-[40px] h-[40px] rounded-md items-center justify-center ${on ? 'bg-accent' : 'border border-border'}`}>
                          <Icon size={20} color={on ? kitColors.inverse : kitColors.icon} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-body-md font-medium text-text-primary">{o.label}</Text>
                          <Text className="text-body-sm text-text-tertiary">{o.description}</Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Field>

          {outcome === 'purchased' ? (
            <TextField label="Order number" hint="Optional. Links the visit to the sale." value={orderRef} onChangeText={setOrderRef} placeholder="e.g. #1042" autoCapitalize="characters" autoCorrect={false} />
          ) : null}

          <Field label="Follow-up email" hint={consentCaptured ? `Their loved frames${photoCount ? ' and photos' : ''}, so they can decide at home.` : 'Needs their consent from the fitting (photos and email).'}>
            <View className="flex-row items-center justify-between gap-[16px] border border-border rounded-md px-[16px] min-h-[56px]">
              <View className="flex-1 flex-row items-center gap-[8px]">
                <Text className="text-body-md text-text-primary">Send a summary</Text>
                {lovedFrames.length ? <Badge>{`${lovedFrames.length} loved`}</Badge> : null}
              </View>
              {sendSummary && consentCaptured ? (
                <ChoiceChips options={[{ key: 'en', label: 'English' }, { key: 'fr', label: 'Français' }]} value={language} onChange={(l: Language | null) => setLanguage(l ?? language)} />
              ) : null}
              <Switch
                value={sendSummary && consentCaptured}
                onValueChange={setSendSummary}
                disabled={!consentCaptured}
                trackColor={{ true: kitColors.primary, false: kitColors.border }}
                accessibilityLabel="Send a summary email"
              />
            </View>
          </Field>

          <Field label="Notes for the team" hint="Staff only. Saved to their history.">
            <ChoiceChips multiple options={QUICK_TAGS} value={selectedTags} onChange={setSelectedTags} />
          </Field>
          <TextField label="Notes" value={internalNotes} onChangeText={setInternalNotes} placeholder="What they liked, what to try next time" multiline />

          <Pressable onPress={handleQuickEnd} accessibilityRole="button" className="self-start min-h-[44px] justify-center" disabled={isSubmitting}>
            <Text className="text-body-sm text-text-tertiary underline">End without details (counts as no sale)</Text>
          </Pressable>
        </View>
      </Sheet>

      <CreateAppointmentSheet
        visible={showFollowUpSheet}
        onClose={handleFollowUpSheetClose}
        preselectedClientId={savedClientIdRef.current}
        preselectedServiceType="follow-up"
        followUpContext={{
          previousSessionId: savedSessionIdRef.current || undefined,
          suggestedNotes: `Follow-up from session on ${new Date().toLocaleDateString()}`,
        }}
      />
    </>
  );
}
