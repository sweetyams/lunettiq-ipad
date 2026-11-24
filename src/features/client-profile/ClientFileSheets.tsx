/**
 * Handoff and frame-collection sheets (gap checklist, Customer profile). Both write
 * to enrichment customFields via clientFile.ts helpers.
 */
import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { ChoiceChips, Field, Sheet, TextField, kitColors } from '@/src/ui/kit';
import { useClient, useUpdateEnrichment } from '@/src/api/useClients';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { toast } from '@/src/ui/useToastStore';
import { useLangStore } from '@/src/i18n';
import {
  COLLECTION_LABELS, COLLECTION_ROLES, HANDOFF_LABELS, HANDOFF_REASONS, readCollection, readHandoff,
  withCollection, withHandoff, type CollectionPair, type CollectionRole, type HandoffReason,
} from './clientFile';

interface Props { clientId: string; visible: boolean; onClose: () => void }

function useSaver(clientId: string) {
  const lang = useLangStore((s) => s.uiLang);
  const update = useUpdateEnrichment();
  const save = async (customFields: Record<string, unknown>, onDone: () => void) => {
    try {
      await update.mutateAsync({ clientId, data: { customFields } });
      toast.success(lang === 'fr' ? 'Enregistré' : 'Saved');
      onDone();
    } catch {
      toast.error(lang === 'fr' ? 'Non enregistré' : 'Couldn’t save', lang === 'fr' ? 'Vérifiez la connexion et réessayez.' : 'Check the connection and try again.');
    }
  };
  return { save, saving: update.isPending, lang };
}

/** What the client is coming back for, so another staff member can pick up. */
export function HandoffSheet({ clientId, visible, onClose }: Props) {
  const { data: client } = useClient(clientId);
  const operator = useOperatorStore((s) => s.activeOperator);
  const { save, saving, lang } = useSaver(clientId);
  const current = useMemo(() => readHandoff(client?.enrichment?.customFields), [client]);
  const [reasons, setReasons] = useState<HandoffReason[]>(current?.reasons ?? []);
  const [when, setWhen] = useState(current?.when ?? '');
  const [note, setNote] = useState(current?.note ?? '');
  const fr = lang === 'fr';

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={fr ? 'Pour la suite' : 'Handoff'}
      subtitle={fr ? 'Ce qu’ils reviennent chercher, pour que n’importe qui puisse continuer.' : 'What they’re coming back for, so anyone can pick up where you left off.'}
      secondary={{ label: fr ? 'Annuler' : 'Cancel', onPress: onClose }}
      primary={{
        label: fr ? 'Enregistrer' : 'Save',
        loading: saving,
        onPress: () => save(withHandoff(client?.enrichment?.customFields, {
          reasons, when, note, updatedAt: new Date().toISOString(), updatedBy: operator?.name ?? null,
        }), onClose),
      }}
    >
      <View className="gap-[20px]">
        <Field label={fr ? 'Ils cherchent' : 'They’re looking for'}>
          <ChoiceChips multiple options={HANDOFF_REASONS.map((r) => ({ key: r, label: HANDOFF_LABELS[r][lang] }))} value={reasons} onChange={setReasons} />
        </Field>
        <TextField label={fr ? 'Pour quand' : 'By when'} hint={fr ? 'Ex. « avant le voyage du 12 déc. »' : 'e.g. “before their Dec 12 trip”'} value={when} onChangeText={setWhen} />
        <TextField label={fr ? 'Contexte' : 'Context'} hint={fr ? 'Ce qui a été discuté, ce qu’il reste à montrer.' : 'What was discussed, what’s left to show them.'} value={note} onChangeText={setNote} multiline />
      </View>
    </Sheet>
  );
}

/** The pairs they own, by role. */
export function CollectionSheet({ clientId, visible, onClose }: Props) {
  const { data: client } = useClient(clientId);
  const { save, saving, lang } = useSaver(clientId);
  const fr = lang === 'fr';
  const [pairs, setPairs] = useState<CollectionPair[]>(() => readCollection(client?.enrichment?.customFields));
  const [role, setRole] = useState<CollectionRole | null>(null);
  const [frame, setFrame] = useState('');
  const [fromUs, setFromUs] = useState<'us' | 'elsewhere'>('us');

  const add = () => {
    if (!role || !frame.trim()) return;
    setPairs((p) => [...p, { id: `p_${Date.now()}`, role, frame: frame.trim(), fromUs: fromUs === 'us' }]);
    setRole(null);
    setFrame('');
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title={fr ? 'Collection de montures' : 'Frame collection'}
      subtitle={fr ? 'Leurs paires, par usage. Ce qui manque est le point de départ de la prochaine vente.' : 'Their pairs, by what they’re for. What’s missing is where the next sale starts.'}
      secondary={{ label: fr ? 'Annuler' : 'Cancel', onPress: onClose }}
      primary={{ label: fr ? 'Enregistrer' : 'Save', loading: saving, onPress: () => save(withCollection(client?.enrichment?.customFields, pairs), onClose) }}
    >
      <View className="gap-[20px]">
        {pairs.length ? (
          <View className="border border-border rounded-lg">
            {pairs.map((p, i) => (
              <View key={p.id} className={`flex-row items-center gap-[12px] px-[16px] min-h-[52px] ${i ? 'border-t border-border' : ''}`}>
                <Text className="w-[160px] text-body-sm text-text-tertiary">{COLLECTION_LABELS[p.role][lang]}</Text>
                <Text className="flex-1 text-body-md text-text-primary" numberOfLines={1}>{p.frame}</Text>
                <Text className="text-body-sm text-text-tertiary">{p.fromUs ? 'Lunettiq' : (fr ? 'Ailleurs' : 'Elsewhere')}</Text>
                <Pressable onPress={() => setPairs((all) => all.filter((x) => x.id !== p.id))} accessibilityRole="button" accessibilityLabel={fr ? `Retirer ${p.frame}` : `Remove ${p.frame}`} hitSlop={10} className="w-[44px] h-[44px] items-center justify-center">
                  <X size={18} color={kitColors.iconMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <Field label={fr ? 'Ajouter une paire' : 'Add a pair'}>
          <ChoiceChips options={COLLECTION_ROLES.map((r) => ({ key: r, label: COLLECTION_LABELS[r][lang] }))} value={role} onChange={setRole} />
        </Field>
        <TextField label={fr ? 'Monture' : 'Frame'} placeholder={fr ? 'Ex. Marais écaille, ou « Ray-Ban noire »' : 'e.g. Marais tortoise, or “black Ray-Bans”'} value={frame} onChangeText={setFrame} onSubmitEditing={add} returnKeyType="done" />
        <View className="flex-row items-center gap-[12px]">
          <ChoiceChips options={[{ key: 'us', label: fr ? 'Achetée ici' : 'Bought here' }, { key: 'elsewhere', label: fr ? 'Achetée ailleurs' : 'From elsewhere' }]} value={fromUs} onChange={(v: 'us' | 'elsewhere' | null) => setFromUs(v ?? 'us')} />
          <View className="flex-1" />
          <Pressable onPress={add} disabled={!role || !frame.trim()} accessibilityRole="button" className="min-h-[44px] px-[16px] justify-center rounded-md border border-border">
            <Text className={`text-body-md font-medium ${role && frame.trim() ? 'text-text-primary' : 'text-text-tertiary'}`}>{fr ? 'Ajouter' : 'Add'}</Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}
