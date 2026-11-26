/**
 * Visit additions from the gap checklist (Visit, tray and products):
 * - TraySheet: open and review the tray from any step; each frame large, with its
 *   colours, features, the Rx fit note, the client's reaction and Order.
 * - StyleFinderSheet: guided questions → frame suggestions.
 * - PresentationView: polished client-facing "Your selection" screen + share.
 * - ContactCaptureSheet: "Send you your choices" with a no-marketing promise.
 * - SecondPairPrompt: when the tray narrows to two favourites.
 */
import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Share } from 'react-native';
import { Modal } from '@/src/ui/Modal';
import { Image } from 'expo-image';
import { sizedImage } from '@/src/ui/imageUrl';
import { Sparkles, X, Share2, ShieldCheck } from 'lucide-react-native';
import { Badge, Button, ChoiceChips, Field, Sheet, TextField, VerdictPicker, kitColors } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import { useLangStore, type Lang } from '@/src/i18n';
import { useProduct } from '@/src/api/useProducts';
import { useProductFamily } from '@/src/api/useProductFamily';
import { usePrescriptions } from '@/src/api/usePrescriptions';
import { useClient, useUpdateClient } from '@/src/api/useClients';
import { useSessionStore, type FrameTried } from '@/src/features/session/useSessionStore';
import { DRAFT_TAG, isDraftClient } from '@/src/features/clients/QuickClientSheet';
import { MessageSheet } from '@/src/features/messages/MessageSheet';
import { joinFrames } from '@/src/features/messages/templates';
import { frameSizeOf, rxFitFlags } from './rxFit';
import { STYLE_QUESTIONS, namedPicks, type StyleAnswers } from './styleFinder';

const isLoved = (f: FrameTried) => f.verdict === 'loved' || f.verdict === 'liked';

// ─── Tray ────────────────────────────────────────────────────────────────────

function TrayFrame({ frame, clientId, lang, onOrder, first }: { frame: FrameTried; clientId: string; lang: Lang; onOrder: (f: FrameTried) => void; first: boolean }) {
  const fr = lang === 'fr';
  const { updateFrameVerdict } = useSessionStore();
  const { data: product } = useProduct(frame.productId);
  const { data: family } = useProductFamily(frame.productId);
  const { data: rx } = usePrescriptions({ clientId });
  const flags = useMemo(() => (product ? rxFitFlags(rx?.[0], frameSizeOf(product)) : []), [product, rx]);
  const colours = (family?.siblings ?? []).filter((s) => s.colour).slice(0, 8);
  const features = (product?.tags ?? []).filter((t) => !/^(member-|_|draft)/.test(t)).slice(0, 6);
  const price = product?.priceMin ? `$${Number(product.priceMin).toFixed(0)}` : null;
  return (
    <View className={`flex-row gap-[20px] py-[16px] ${first ? '' : 'border-t border-border'}`}>
      <View className="w-[220px] h-[140px] rounded-lg border border-border overflow-hidden bg-bg-subtle items-center justify-center">
        {frame.imageUrl ? <Image source={{ uri: sizedImage(frame.imageUrl, 640) }} accessibilityLabel={frame.productName} style={{ width: '100%', height: '100%' }} contentFit="contain" /> : null}
      </View>
      <View className="flex-1 gap-[10px]">
        <View className="flex-row items-center gap-[10px]">
          <Text className="flex-1 text-heading-lg text-text-primary" numberOfLines={2}>{frame.productName}</Text>
          {price ? <Text className="text-body-md text-text-secondary" style={{ fontVariant: ['tabular-nums'] }}>{price}</Text> : null}
        </View>
        {colours.length ? (
          <View className="flex-row items-center gap-[6px] flex-wrap">
            {colours.map((c) => (
              <View key={c.handle} accessibilityLabel={c.colour ?? ''} className="flex-row items-center gap-[4px] border border-border rounded-full pl-[4px] pr-[8px] py-[2px]">
                {c.colourHex ? <View className="w-[14px] h-[14px] rounded-full border border-border" style={{ backgroundColor: c.colourHex }} /> : null}
                <Text className="text-body-sm text-text-secondary">{c.colour}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {features.length ? <Text className="text-body-sm text-text-tertiary" numberOfLines={2}>{features.join(' · ')}</Text> : null}
        {flags.map((f) => (
          <View key={f.key} className="flex-row items-start gap-[8px]">
            <Badge tone={f.severity === 'caution' ? 'warning' : 'info'} dot>{fr ? 'Note Rx' : 'Rx note'}</Badge>
            <Text className="flex-1 text-body-sm text-text-secondary">{f.message[lang]}</Text>
          </View>
        ))}
        <View className="flex-row items-center gap-[10px] mt-[4px]">
          <VerdictPicker value={frame.verdict} onChange={(v) => updateFrameVerdict(frame.id, v)} label={frame.productName} />
          <View className="flex-1" />
          {isLoved(frame) ? <Button label={fr ? 'Commander' : 'Order'} size="sm" variant="primary" onPress={() => onOrder(frame)} /> : null}
        </View>
      </View>
    </View>
  );
}

export function TraySheet({ visible, onClose, clientId, onOrder, onAddOn }: {
  visible: boolean; onClose: () => void; clientId: string; onOrder: (f: FrameTried) => void; onAddOn?: () => void;
}) {
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const { framesTried } = useSessionStore();
  const [filter, setFilter] = useState<'all' | 'loved'>('all');
  const list = (filter === 'loved' ? framesTried.filter(isLoved) : framesTried).slice().reverse();
  const loved = framesTried.filter(isLoved).length;
  return (
    <Sheet visible={visible} onClose={onClose} wide fill
      title={fr ? 'Plateau' : 'Tray'}
      subtitle={fr ? `${framesTried.length} essayées · ${loved} aimées` : `${framesTried.length} tried · ${loved} loved`}
      secondary={{ label: fr ? 'Fermer' : 'Close', onPress: onClose }}>
      <View className="gap-[12px]">
        <View className="flex-row items-center gap-[12px]">
          <ChoiceChips options={[{ key: 'all', label: fr ? 'Toutes' : 'All' }, { key: 'loved', label: fr ? 'Aimées' : 'Loved' }]} value={filter} onChange={(v: 'all' | 'loved' | null) => setFilter(v ?? 'all')} />
          <View className="flex-1" />
          {onAddOn ? <Button label={fr ? 'Options de verres' : 'Lens add-ons'} size="sm" onPress={onAddOn} /> : null}
        </View>
        <SecondPairPrompt />
        {list.length === 0
          ? <Text className="text-body-md text-text-tertiary py-[24px]">{fr ? 'Rien ici encore.' : 'Nothing here yet.'}</Text>
          : list.map((f, i) => <TrayFrame key={f.id} first={i === 0} frame={f} clientId={clientId} lang={lang} onOrder={(x) => { onClose(); onOrder(x); }} />)}
      </View>
    </Sheet>
  );
}

/** Two favourites left: the moment to offer the second pair (gap checklist, Sales). */
export function SecondPairPrompt() {
  const fr = useLangStore((s) => s.uiLang) === 'fr';
  // Select the stable array, filter outside: a selector returning a new array re-renders forever.
  const frames = useSessionStore((s) => s.framesTried);
  const loved = useMemo(() => frames.filter(isLoved), [frames]);
  if (loved.length !== 2) return null;
  return (
    <View className="flex-row items-start gap-[12px] rounded-lg border border-info-ring bg-info-soft px-[16px] py-[12px]">
      <Sparkles size={18} color={kitColors.icon} />
      <View className="flex-1">
        <Text className="text-body-md font-medium text-text-primary">{fr ? 'Deux favorites : proposez la deuxième paire' : 'Down to two: offer the second pair'}</Text>
        <Text className="text-body-sm text-text-secondary">
          {fr ? `${loved[0]!.productName} et ${loved[1]!.productName}. Pourquoi choisir? Mentionnez la mise à niveau offerte sur la deuxième paire.`
            : `${loved[0]!.productName} and ${loved[1]!.productName}. Why choose? Mention the free upgrade on the second pair.`}
        </Text>
      </View>
    </View>
  );
}

// ─── Style finder ────────────────────────────────────────────────────────────

export function StyleFinderSheet({ visible, onClose, initial, onApply }: {
  visible: boolean; onClose: () => void; initial: StyleAnswers; onApply: (a: StyleAnswers) => void;
}) {
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const [answers, setAnswers] = useState<StyleAnswers>(initial);
  const picks = namedPicks(answers);
  return (
    <Sheet visible={visible} onClose={onClose} wide
      title={fr ? 'Trouver leur style' : 'Find their style'}
      subtitle={fr ? 'Quelques questions; les montures qui correspondent passent en premier.' : 'A few questions; matching frames move to the front.'}
      secondary={{ label: fr ? 'Effacer' : 'Clear', onPress: () => { onApply({}); onClose(); } }}
      primary={{ label: fr ? 'Voir les suggestions' : 'Show suggestions', onPress: () => { onApply(answers); onClose(); } }}>
      <View className="gap-[20px]">
        {STYLE_QUESTIONS.map((q) => (
          <Field key={q.key} label={q.label[lang]}>
            <ChoiceChips
              options={q.options.map((o) => ({ key: o.key as string, label: o.label[lang] }))}
              value={(answers[q.key] as string | undefined) ?? null}
              onChange={(v: string | null) => setAnswers((a) => ({ ...a, [q.key]: v ?? undefined }))}
            />
          </Field>
        ))}
        {picks.map((p) => (
          <View key={p.families.join()} className="flex-row items-center gap-[10px] rounded-lg border border-border px-[16px] py-[12px]">
            <Sparkles size={18} color={kitColors.icon} />
            <Text className="flex-1 text-body-md text-text-primary">{p.why[lang]}</Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

// ─── Client-facing presentation ──────────────────────────────────────────────

export function PresentationView({ visible, onClose, clientFirstName }: { visible: boolean; onClose: () => void; clientFirstName?: string | null }) {
  const lang = useLangStore((s) => s.clientLang);
  const fr = lang === 'fr';
  const frames = useSessionStore((s) => s.framesTried);
  const shown = frames.filter(isLoved).length ? frames.filter(isLoved) : frames;
  const share = async () => {
    const names = joinFrames(shown.map((f) => f.productName), lang);
    try {
      await Share.share({ message: fr ? `Ma sélection chez Lunettiq : ${names}` : `My selection from Lunettiq: ${names}` });
    } catch { /* dismissed */ }
  };
  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View className="flex-1 bg-bg-page">
        <View className="flex-row items-center px-[40px] pt-[40px] pb-[16px]">
          <View className="flex-1">
            <Text className="text-caption-sm uppercase text-text-tertiary tracking-widest">Lunettiq</Text>
            <Text className="text-display-lg text-text-primary mt-[4px]">
              {clientFirstName ? (fr ? `La sélection de ${clientFirstName}` : `${clientFirstName}’s selection`) : (fr ? 'Votre sélection' : 'Your selection')}
            </Text>
          </View>
          {shown.length ? <Button label={fr ? 'Partager' : 'Share'} icon={Share2} variant="ghost" onPress={share} /> : null}
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={fr ? 'Fermer' : 'Close'} className="w-[52px] h-[52px] items-center justify-center">
            <X size={26} color={kitColors.icon} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 40, paddingBottom: 60, flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
          {shown.length === 0 ? (
            <Text className="text-body-lg text-text-tertiary">{fr ? 'Les montures essayées apparaîtront ici.' : 'The frames you try will appear here.'}</Text>
          ) : shown.map((f) => (
            <View key={f.id} style={{ width: shown.length === 1 ? '100%' : '48%' }} className="gap-[12px]">
              <View className="aspect-[16/9] rounded-xl bg-bg-subtle overflow-hidden items-center justify-center">
                {f.imageUrl ? <Image source={{ uri: sizedImage(f.imageUrl, 384) }} accessibilityLabel={f.productName} style={{ width: '90%', height: '90%' }} contentFit="contain" transition={200} /> : null}
              </View>
              <Text className="text-heading-xl text-text-primary text-center">{f.productName}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Contact capture ─────────────────────────────────────────────────────────

/**
 * "Can we send you your choices?" — the contact step framed as a service, with a
 * no-marketing promise. Turns a guest profile into a real one, then opens the
 * message with their loved frames.
 */
export function ContactCaptureSheet({ visible, onClose, clientId }: { visible: boolean; onClose: () => void; clientId: string }) {
  const lang = useLangStore((s) => s.clientLang);
  const fr = lang === 'fr';
  const { data: client } = useClient(clientId);
  const update = useUpdateClient();
  const draft = isDraftClient(client);
  const frames = useSessionStore((s) => s.framesTried);
  const loved = frames.filter(isLoved);
  const [firstName, setFirstName] = useState(draft ? '' : client?.firstName ?? '');
  const [lastName, setLastName] = useState(draft ? '' : client?.lastName ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [compose, setCompose] = useState(false);
  const ok = (phone.replace(/\D/g, '').length >= 10 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) && (!draft || firstName.trim());

  const save = async () => {
    const data: Record<string, unknown> = { phone: phone.trim() || null, email: email.trim() || null };
    if (firstName.trim()) data.firstName = firstName.trim();
    if (lastName.trim() || draft) data.lastName = lastName.trim() || (draft ? '-' : undefined);
    if (draft) data.tags = (client?.tags ?? []).filter((t) => t !== DRAFT_TAG);
    try {
      await update.mutateAsync({ id: clientId, data });
      setCompose(true);
    } catch {
      toast.error(fr ? 'Coordonnées non enregistrées' : 'Couldn’t save the details');
    }
  };

  if (compose) {
    return (
      <MessageSheet visible onClose={() => { setCompose(false); onClose(); }}
        recipient={{ firstName: firstName || client?.firstName, phone, email, language: lang }}
        templates={['visit_choices']}
        vars={{ frames: joinFrames((loved.length ? loved : frames).map((f) => f.productName), lang) }} />
    );
  }

  return (
    <Sheet visible={visible} onClose={onClose}
      title={fr ? 'On vous envoie votre sélection?' : 'Shall we send you your choices?'}
      subtitle={fr ? 'Vos montures préférées, pour y repenser à la maison.' : 'Your favourite frames, to think them over at home.'}
      secondary={{ label: fr ? 'Pas maintenant' : 'Not now', onPress: onClose }}
      primary={{ label: fr ? 'Envoyer ma sélection' : 'Send my choices', onPress: save, disabled: !ok, loading: update.isPending }}>
      <View className="gap-[16px]">
        <View className="flex-row gap-[12px]">
          <TextField className="flex-1" label={fr ? 'Prénom' : 'First name'} required={draft} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
          <TextField className="flex-1" label={fr ? 'Nom' : 'Last name'} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
        </View>
        <View className="flex-row gap-[12px]">
          <TextField className="flex-1" label={fr ? 'Cellulaire' : 'Mobile'} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextField className="flex-1" label={fr ? 'ou courriel' : 'or email'} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        </View>
        <View className="flex-row items-start gap-[10px] rounded-lg bg-bg-subtle px-[16px] py-[12px]">
          <ShieldCheck size={18} color={kitColors.icon} />
          <Text className="flex-1 text-body-sm text-text-secondary">
            {fr ? 'Seulement votre sélection. Aucune infolettre, aucune publicité, sauf si vous le demandez.'
              : 'Just your choices. No newsletters, no marketing, unless you ask for it.'}
          </Text>
        </View>
      </View>
    </Sheet>
  );
}
