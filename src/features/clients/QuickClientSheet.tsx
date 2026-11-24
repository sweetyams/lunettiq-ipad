/**
 * New client, from anywhere (gap checklist: "create customer reachable from any
 * page", "register a customer from inside a walk-in", "intake can start with no
 * name or contact details").
 *
 * Foundry requires a first and last name (POST /api/clients), so "Start without a
 * name" creates a guest profile tagged `draft-profile` ("Guest · Nov 24 14:05").
 * Frames tried and liked are recorded against it from the first tap; the
 * "Send you your choices" step later turns it into a real profile.
 */
import { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ChoiceChips, Field, ListRow, Sheet, TextField, kitColors, formatPhone } from '@/src/ui/kit';
import { useCreateClient, duplicatesFromError } from '@/src/api/useCreateClient';
import { useUpdateClient } from '@/src/api/useClients';
import type { DuplicateClient } from '@/src/api/duplicateCheck';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { toast } from '@/src/ui/useToastStore';
import { useLangStore } from '@/src/i18n';

export const DRAFT_TAG = 'draft-profile';

export function isDraftClient(c: { tags?: string[] | null } | null | undefined): boolean {
  return !!c?.tags?.includes(DRAFT_TAG);
}

/** "Guest", "Nov 24 14:05" — readable in lists, obviously not a real name. */
export function guestName(now: Date = new Date(), lang: 'en' | 'fr' = 'en'): { firstName: string; lastName: string } {
  const date = now.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' });
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return { firstName: lang === 'fr' ? 'Invité' : 'Guest', lastName: `${date} ${time}` };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Open the visit right after creating (walk-ins). */
  startVisit?: boolean;
  /** Start in "no name" mode (walk-in "Start without details"). */
  anonymous?: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function QuickClientSheet({ visible, onClose, startVisit: startDefault = false, anonymous = false }: Props) {
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const router = useRouter();
  const create = useCreateClient();
  const update = useUpdateClient();
  const { startSession, mode } = useSessionStore();
  const [noName, setNoName] = useState(anonymous);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<'en' | 'fr'>(lang);
  const [visit, setVisit] = useState(startDefault);
  const [dupes, setDupes] = useState<DuplicateClient[] | null>(null);

  const emailError = email.trim() && !EMAIL.test(email.trim()) ? (fr ? 'Courriel invalide' : 'Not a valid email') : null;
  const phoneError = phone.trim() && phone.replace(/\D/g, '').length < 10 ? (fr ? '10 chiffres' : '10 digits') : null;
  const canSave = !emailError && !phoneError && (noName || (firstName.trim() && lastName.trim()));

  const open = (id: string, name: string) => {
    onClose();
    if (visit && mode === 'idle') {
      startSession(id, name);
      router.push(`/clients/${id}/session`);
    } else {
      if (visit) toast.warning(fr ? 'Une visite est déjà ouverte' : 'Another visit is open', fr ? 'Profil créé; terminez l’autre visite d’abord.' : 'Profile created; end the other visit first.');
      router.push(`/clients/${id}`);
    }
  };

  const save = async (force = false) => {
    const guest = noName ? guestName(new Date(), lang) : null;
    const fn = guest?.firstName ?? firstName.trim();
    const ln = guest?.lastName ?? lastName.trim();
    try {
      const c = await create.mutateAsync({
        firstName: fn, lastName: ln,
        email: email.trim() || undefined, phone: phone.trim() || undefined,
        preferredLanguage: language, force,
      });
      if (guest) await update.mutateAsync({ id: c.id, data: { tags: [DRAFT_TAG] } }).catch(() => undefined);
      toast.success(guest ? (fr ? 'Visite invitée créée' : 'Guest profile started') : (fr ? 'Client créé' : 'Client added'));
      open(c.id, guest ? fn : `${fn} ${ln}`);
    } catch (e) {
      const found = duplicatesFromError(e);
      if (found) { setDupes(found); return; }
      toast.error(fr ? 'Client non créé' : 'Couldn’t add the client', e instanceof Error ? e.message : undefined);
    }
  };

  if (dupes) {
    return (
      <Sheet
        visible={visible}
        onClose={onClose}
        title={fr ? 'Déjà au dossier?' : 'Already a client?'}
        subtitle={fr ? 'Ce courriel ou téléphone correspond à un client existant.' : 'That email or phone matches an existing client.'}
        secondary={{ label: fr ? 'Créer quand même' : 'Create anyway', onPress: () => { setDupes(null); void save(true); } }}
      >
        <View className="border border-border rounded-lg">
          {dupes.map((d, i) => (
            <ListRow key={d.id} divider={i > 0} title={d.fullName || (fr ? 'Sans nom' : 'No name')}
              subtitle={[d.email, formatPhone(d.phone)].filter(Boolean).join(' · ')}
              trailing={<Button label={fr ? 'Utiliser' : 'Use this client'} size="sm" variant="primary" onPress={() => open(d.id, d.fullName)} />} />
          ))}
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={fr ? 'Nouveau client' : 'New client'}
      subtitle={fr ? 'Seul le nom est demandé, et il peut attendre.' : 'Only a name is needed, and even that can wait.'}
      secondary={{ label: fr ? 'Annuler' : 'Cancel', onPress: onClose }}
      primary={{
        label: visit ? (fr ? 'Créer et commencer la visite' : 'Add and start visit') : (fr ? 'Créer' : 'Add client'),
        onPress: () => save(false), disabled: !canSave, loading: create.isPending,
      }}
    >
      <View className="gap-[18px]">
        <View className="flex-row items-center justify-between gap-[16px] border border-border rounded-md px-[16px] min-h-[56px]">
          <View className="flex-1">
            <Text className="text-body-md text-text-primary">{fr ? 'Commencer sans nom' : 'Start without a name'}</Text>
            <Text className="text-body-sm text-text-tertiary">{fr ? 'Les montures essayées sont gardées; les coordonnées viennent à la fin.' : 'Frames they try are kept; contact details come at the end.'}</Text>
          </View>
          <Switch value={noName} onValueChange={setNoName} trackColor={{ true: kitColors.primary, false: kitColors.border }} accessibilityLabel={fr ? 'Commencer sans nom' : 'Start without a name'} />
        </View>
        {!noName ? (
          <View className="flex-row gap-[12px]">
            <TextField className="flex-1" label={fr ? 'Prénom' : 'First name'} required value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoFocus />
            <TextField className="flex-1" label={fr ? 'Nom' : 'Last name'} required value={lastName} onChangeText={setLastName} autoCapitalize="words" />
          </View>
        ) : null}
        <View className="flex-row gap-[12px]">
          <TextField className="flex-1" label={fr ? 'Téléphone' : 'Phone'} value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={phoneError} />
          <TextField className="flex-1" label={fr ? 'Courriel' : 'Email'} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={emailError} />
        </View>
        <View className="flex-row items-end gap-[16px]">
          <Field label={fr ? 'Langue' : 'Language'}>
            <ChoiceChips options={[{ key: 'en', label: 'English' }, { key: 'fr', label: 'Français' }]} value={language} onChange={(l: 'en' | 'fr' | null) => l && setLanguage(l)} />
          </Field>
          <View className="flex-1" />
          <View className="flex-row items-center gap-[10px] min-h-[44px]">
            <Text className="text-body-md text-text-primary">{fr ? 'Commencer une visite' : 'Start a visit'}</Text>
            <Switch value={visit} onValueChange={setVisit} trackColor={{ true: kitColors.primary, false: kitColors.border }} accessibilityLabel={fr ? 'Commencer une visite' : 'Start a visit'} />
          </View>
        </View>
      </View>
    </Sheet>
  );
}
