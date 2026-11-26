/**
 * The optician's review of one Rx approval request, on the iPad (the web's
 * admin/rx-approvals/[id] workspace). Foundry signs off only when every checklist
 * section is marked reviewed, no blocking flag is open, the review lasted the
 * minimum time, and the optician re-authenticated — here, with their PIN.
 * Only the account that claimed the request can act on it.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useUser } from '@clerk/clerk-expo';
import { Check, ShieldCheck, Undo2, XCircle } from 'lucide-react-native';
import {
  useApprovalDetail, useApprovalHeartbeat, useClaimApproval, useMarkReviewed,
  useRejectApproval, useReleaseApproval, useReturnApproval, useSignOffApproval,
} from '@/src/api/useRxApprovals';
import { useVerifyPin } from '@/src/api/useDeviceAuth';
import {
  ATTESTATION, CHECKLIST_SECTIONS, REJECT_CATEGORIES, RETURN_REASONS, SECTION_LABELS,
  signOffBlockers, signOffErrorMessage, type ApprovalView, type ChecklistSection,
} from '@/src/api/approvalDetail';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { Badge, Button, ChoiceChips, KeyValue, Section, Sheet, TextField, kitColors } from '@/src/ui/kit';
import { PinPad } from '@/src/ui/PinPad';
import { toast } from '@/src/ui/useToastStore';

type Mode = 'review' | 'return' | 'reject' | 'sign';
const HEARTBEAT_S = 10;

function SectionBody({ section, v }: { section: ChecklistSection; v: ApprovalView }) {
  const none = (t: string) => <Text className="text-body-md text-text-tertiary">{t}</Text>;
  switch (section) {
    case 'rx': return v.rx.length ? <KeyValue mono rows={v.rx} /> : none('No prescription values in the request.');
    case 'measurements': return v.measurements.length ? <KeyValue mono rows={v.measurements} /> : none('No measurements in the request.');
    case 'frame_lens': return v.frameLens.length ? <KeyValue rows={v.frameLens} /> : none('No frame or lens details.');
    case 'photos':
      return v.photos.length ? (
        <View className="flex-row flex-wrap gap-[8px]">
          {v.photos.map((u) => <Image key={u} source={{ uri: u }} contentFit="cover" style={{ width: 120, height: 120, borderRadius: 8 }} accessibilityLabel="Fitting photo" />)}
        </View>
      ) : none('No photos with this request.');
    case 'flags':
      return v.flags.length ? (
        <View className="gap-[8px]">
          {v.flags.map((f) => (
            <View key={f.id} className="flex-row items-center gap-[10px]">
              <Badge tone={f.resolved ? 'success' : f.severity === 'block' ? 'danger' : 'warning'} dot>{f.resolved ? 'Resolved' : f.severity === 'block' ? 'Blocks sign-off' : 'Check'}</Badge>
              <Text className="flex-1 text-body-md text-text-primary">{f.label}</Text>
            </View>
          ))}
        </View>
      ) : none('No flags raised.');
    case 'notes': return v.notes ? <Text className="text-body-md text-text-primary">{v.notes}</Text> : none('No notes from the stylist.');
  }
}

export function ApprovalReviewSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const router = useRouter();
  const { user } = useUser();
  const { data: v, isLoading, error, refetch } = useApprovalDetail(id);
  const claim = useClaimApproval();
  const release = useReleaseApproval();
  const mark = useMarkReviewed();
  const heartbeat = useApprovalHeartbeat();
  const signOff = useSignOffApproval();
  const sendBack = useReturnApproval();
  const reject = useRejectApproval();
  const verifyPin = useVerifyPin();
  const { roster, activeOperator } = useOperatorStore();

  const [mode, setMode] = useState<Mode>('review');
  const [reason, setReason] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [dwell, setDwell] = useState(0);
  const openedAt = useRef(new Date().toISOString());

  const mine = !!v && v.status === 'in_review' && !!user?.id && v.claimedBy === user.id;
  useEffect(() => { if (v) setDwell((d) => Math.max(d, v.dwellSeconds)); }, [v]);

  // Review time counts while the request is open, claimed by me, and the app is in front.
  useEffect(() => {
    if (!mine) return;
    const t = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      heartbeat.mutate({ id, deltaSeconds: HEARTBEAT_S }, { onSuccess: (r) => r?.dwellSeconds != null && setDwell(r.dwellSeconds) });
    }, HEARTBEAT_S * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine, id]);

  // The optician who signs: the staff row of the account Foundry sees (the one that claimed).
  const signer = useMemo(
    () => (activeOperator?.clerkUserId === user?.id ? activeOperator : roster.find((s) => s.clerkUserId === user?.id)) ?? null,
    [activeOperator, roster, user?.id],
  );

  const blockers = v ? signOffBlockers(v, dwell) : [];
  const busy = claim.isPending || release.isPending || signOff.isPending || sendBack.isPending || reject.isPending;
  const done = () => { void refetch(); onClose(); };

  const doClaim = () => claim.mutate(id, {
    onSuccess: () => { toast.success('Claimed', 'Review each section, then sign off.'); void refetch(); },
    onError: () => toast.error('Couldn’t claim', 'Another optician may have taken it.'),
  });
  const doRelease = () => release.mutate(id, {
    onSuccess: () => { toast.info('Released', 'Back in the pending queue.'); done(); },
    onError: () => toast.error('Couldn’t release', 'Check the connection and try again.'),
  });
  const doMark = (section: ChecklistSection) => mark.mutate(
    { id, section, viewedAt: openedAt.current },
    { onError: () => toast.error('Not marked', 'Check the connection and try again.') },
  );
  const doReturn = () => {
    const r = RETURN_REASONS.find((x) => x.key === reason);
    if (!r || !note.trim()) return;
    sendBack.mutate({ id, payload: { reasons: [{ code: r.key, label: r.label }], note: note.trim() } }, {
      onSuccess: () => { toast.success('Returned to the stylist', r.label); done(); },
      onError: (e) => toast.error('Not returned', (e as Error).message),
    });
  };
  const doReject = () => {
    if (!category || !note.trim()) return;
    reject.mutate({ id, payload: { category, note: note.trim() } }, {
      onSuccess: () => { toast.success('Order rejected', 'The stylist is told why.'); done(); },
      onError: (e) => toast.error('Not rejected', (e as Error).message),
    });
  };
  const doSign = async (pin: string) => {
    if (!signer) return;
    setPinError(null);
    try {
      await verifyPin.mutateAsync({ staffId: signer.staffId, pin });
    } catch (e) {
      setPinError((e as { code?: string }).code === 'LOCKED' ? 'Too many tries. PIN locked for a while.' : 'That PIN isn’t right.');
      return;
    }
    signOff.mutate(
      { id, payload: { reauth: { method: 'surface_pin', token: `pin:${signer.staffId}:${Date.now()}` }, attestationVersion: ATTESTATION.version } },
      {
        onSuccess: () => { toast.success('Signed off', 'The order goes to the lab.'); done(); },
        onError: (e) => { setMode('review'); toast.error('Not signed off', signOffErrorMessage(e)); void refetch(); },
      },
    );
  };

  const title = v ? v.clientName : 'Review';
  const subtitle = v ? [v.frameLens[0]?.value, v.frameLens[1]?.value].filter(Boolean).join(' · ') || undefined : undefined;

  const footer = !v ? undefined : mode === 'return' ? (
    <View className="flex-1 flex-row justify-end gap-[8px]">
      <Button label="Back" variant="ghost" onPress={() => setMode('review')} />
      <Button label="Return to stylist" variant="primary" onPress={doReturn} disabled={!reason || !note.trim()} loading={sendBack.isPending} />
    </View>
  ) : mode === 'reject' ? (
    <View className="flex-1 flex-row justify-end gap-[8px]">
      <Button label="Back" variant="ghost" onPress={() => setMode('review')} />
      <Button label="Reject order" variant="danger" onPress={doReject} disabled={!category || !note.trim()} loading={reject.isPending} />
    </View>
  ) : mode === 'sign' ? (
    <View className="flex-1 flex-row justify-end gap-[8px]">
      <Button label="Back" variant="ghost" onPress={() => { setMode('review'); setPinError(null); }} />
    </View>
  ) : v.status === 'submitted' ? (
    <View className="flex-1 flex-row justify-end gap-[8px]">
      <Button label="Close" variant="ghost" onPress={onClose} />
      <Button label="Claim to review" variant="primary" onPress={doClaim} loading={claim.isPending} />
    </View>
  ) : mine ? (
    <View className="flex-1 flex-row items-center gap-[8px]">
      <Button label="Release" variant="ghost" onPress={doRelease} disabled={busy} />
      <Button label="Reject" icon={XCircle} variant="ghost" onPress={() => { setNote(''); setMode('reject'); }} disabled={busy} />
      <View className="flex-1 items-end pr-[4px]">
        {blockers.length ? <Text className="text-body-sm text-text-tertiary text-right" numberOfLines={2}>{blockers.join(' · ')}</Text> : null}
      </View>
      <Button label="Return" icon={Undo2} onPress={() => { setNote(''); setMode('return'); }} disabled={busy} />
      <Button label="Sign off" icon={ShieldCheck} variant="primary" onPress={() => setMode('sign')} disabled={busy || blockers.length > 0} />
    </View>
  ) : (
    <View className="flex-1 flex-row justify-end"><Button label="Close" variant="ghost" onPress={onClose} /></View>
  );

  return (
    <Sheet visible onClose={onClose} wide title={title} subtitle={subtitle} footer={footer}>
      {isLoading ? (
        <View className="py-[48px] items-center"><ActivityIndicator color={kitColors.primary} /></View>
      ) : error || !v ? (
        <View className="gap-[12px]">
          <Text className="text-body-md text-text-secondary">This request didn’t load.</Text>
          <View className="flex-row"><Button label="Try again" onPress={() => refetch()} /></View>
        </View>
      ) : mode === 'return' ? (
        <View className="gap-[16px]">
          <Text className="text-body-md text-text-secondary">The stylist gets it back with your reason and note, fixes it, and sends it again.</Text>
          <ChoiceChips options={RETURN_REASONS} value={reason as (typeof RETURN_REASONS)[number]['key'] | null} onChange={(k) => setReason(k)} />
          <TextField label="Note to the stylist" required value={note} onChangeText={setNote} placeholder="What needs fixing" multiline />
        </View>
      ) : mode === 'reject' ? (
        <View className="gap-[16px]">
          <Text className="text-body-md text-text-secondary">Rejecting is final: this order can’t be made. To have something fixed, return it instead.</Text>
          <ChoiceChips options={REJECT_CATEGORIES} value={category as (typeof REJECT_CATEGORIES)[number]['key'] | null} onChange={(k) => setCategory(k)} />
          <TextField label="Why" required value={note} onChangeText={setNote} placeholder="The stylist and client see this" multiline />
        </View>
      ) : mode === 'sign' ? (
        <View className="gap-[20px] items-center">
          <View className="self-stretch rounded-lg border border-border p-[16px] gap-[8px]">
            <Text className="text-body-md font-medium text-text-primary">« {ATTESTATION.fr} »</Text>
            <Text className="text-body-sm text-text-secondary">{ATTESTATION.en}</Text>
          </View>
          {signer ? (
            <PinPad
              title={`Sign as ${signer.name}`}
              subtitle="Enter your PIN to sign under your optician licence."
              onComplete={doSign}
              error={pinError}
              disabled={verifyPin.isPending || signOff.isPending}
            />
          ) : (
            <Text className="text-body-md text-text-secondary text-center">This account isn’t on the store’s staff list, so it can’t sign here. Sign off from Foundry on the web.</Text>
          )}
        </View>
      ) : (
        <View className="gap-[16px]">
          <View className="flex-row items-center gap-[8px] flex-wrap">
            {v.priority === 'high' ? <Badge tone="warning">High priority</Badge> : null}
            {v.signedAt ? <Badge tone="success" dot>Signed off</Badge> : v.status === 'in_review' ? (
              <Badge tone="info">{mine ? `Your review · ${Math.floor(dwell)}s of ${v.dwellFloor}s` : `Being checked by ${v.claimantName ?? 'another optician'}`}</Badge>
            ) : <Badge>{v.status.replace(/_/g, ' ')}</Badge>}
            {v.clientId ? (
              <Pressable onPress={() => { onClose(); router.push(`/clients/${v.clientId}`); }} accessibilityRole="link" className="min-h-[44px] justify-center ml-auto">
                <Text className="text-body-sm font-medium text-text-primary underline">Open client</Text>
              </Pressable>
            ) : null}
          </View>
          {CHECKLIST_SECTIONS.map((s) => (
            <Section
              key={s}
              title={`${v.reviewed[s] ? '✓ ' : ''}${SECTION_LABELS[s]}`}
              action={mine && !v.reviewed[s] ? { label: 'Mark reviewed', onPress: () => doMark(s) } : undefined}
            >
              <SectionBody section={s} v={v} />
              {v.reviewed[s] ? (
                <View className="flex-row items-center gap-[6px] mt-[10px]">
                  <Check size={14} color={kitColors.textTertiary} />
                  <Text className="text-body-sm text-text-tertiary">Reviewed</Text>
                </View>
              ) : null}
            </Section>
          ))}
        </View>
      )}
    </Sheet>
  );
}
