import { View } from 'react-native';
import { useState, useEffect } from 'react';
import { Sheet, Field, ChoiceChips } from '@/src/ui/kit';
import { useMultiPairQuestionnaire, useSaveQuestionnaire } from '@/src/api/useMultiPair';
import { toast } from '@/src/ui/useToastStore';
import type { LifestyleResponses } from '@/src/api/multi-pair.types';

interface LifestyleQuestionnaireSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

type Opt<K extends string> = Array<{ key: K; label: string }>;

const WORK: Opt<NonNullable<LifestyleResponses['workEnvironment']>> = [
  { key: 'office', label: 'Office' }, { key: 'mixed', label: 'Mixed' }, { key: 'outdoor', label: 'Outdoors' }, { key: 'industrial', label: 'Workshop / site' },
];
const SCREENS: Opt<NonNullable<LifestyleResponses['screenTime']>> = [
  { key: 'minimal', label: 'Under 2h' }, { key: 'moderate', label: '2–5h' }, { key: 'heavy', label: '5–8h' }, { key: 'extreme', label: 'Over 8h' },
];
const OUTDOORS: Opt<NonNullable<LifestyleResponses['outdoorHours']>> = [
  { key: 'minimal', label: 'Rarely' }, { key: 'moderate', label: 'Weekends' }, { key: 'heavy', label: 'Every day' },
];
const DRIVING: Opt<NonNullable<LifestyleResponses['driving']>> = [
  { key: 'none', label: 'Rarely' }, { key: 'occasional', label: 'Sometimes' }, { key: 'daily', label: 'Every day' }, { key: 'professional', label: 'For work' },
];
const GLARE: Opt<NonNullable<LifestyleResponses['glareSensitivity']>> = [
  { key: 'none', label: 'Not at all' }, { key: 'mild', label: 'A little' }, { key: 'moderate', label: 'Somewhat' }, { key: 'severe', label: 'Very' },
];
const CONCERN: Opt<NonNullable<LifestyleResponses['primaryConcern']>> = [
  { key: 'vision', label: 'Seeing clearly' }, { key: 'style', label: 'Style' }, { key: 'protection', label: 'Protecting their eyes' }, { key: 'convenience', label: 'Convenience' },
];
const SPORTS = ['Running', 'Cycling', 'Skiing', 'Golf', 'Racquet sports', 'Water sports', 'Gym'];
const HOBBIES = ['Reading', 'Crafts', 'Music', 'Gaming', 'Photography', 'Travel'];
const PAIRS = [{ key: '0', label: 'None' }, { key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3 or more' }];

export function LifestyleQuestionnaireSheet({ clientId, visible, onClose }: LifestyleQuestionnaireSheetProps) {
  const [r, setR] = useState<LifestyleResponses>({});
  const { data: existing } = useMultiPairQuestionnaire(clientId);
  const save = useSaveQuestionnaire();
  const last = existing?.[0];

  useEffect(() => {
    if (last?.responses) setR(last.responses);
  }, [last]);

  const set = <K extends keyof LifestyleResponses>(k: K) => (v: LifestyleResponses[K] | null) =>
    setR((prev) => ({ ...prev, [k]: v ?? undefined }));

  const answered = [r.workEnvironment, r.screenTime, r.outdoorHours, r.driving, r.glareSensitivity, r.primaryConcern, r.sports?.length, r.hobbies?.length, r.existingPairs != null]
    .filter(Boolean).length;

  const submit = async () => {
    try {
      await save.mutateAsync({ customerId: clientId, responses: r });
      toast.success('Lifestyle saved');
      onClose();
    } catch {
      toast.error('Couldn’t save', 'Check the connection and try again. Answers are still here.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title="Lifestyle"
      subtitle="Two minutes. Helps suggest the right lenses and a second pair."
      footerNote={`${answered} of 9 answered`}
      primary={{ label: 'Save lifestyle', onPress: submit, disabled: answered === 0, loading: save.isPending }}
    >
      <View className="gap-[24px]">
        <Field label="Where do they work?"><ChoiceChips options={WORK} value={r.workEnvironment ?? null} onChange={set('workEnvironment')} /></Field>
        <Field label="Screen time a day"><ChoiceChips options={SCREENS} value={r.screenTime ?? null} onChange={set('screenTime')} /></Field>
        <Field label="Time outdoors"><ChoiceChips options={OUTDOORS} value={r.outdoorHours ?? null} onChange={set('outdoorHours')} /></Field>
        <Field label="Driving"><ChoiceChips options={DRIVING} value={r.driving ?? null} onChange={set('driving')} /></Field>
        <Field label="Bothered by glare or bright light"><ChoiceChips options={GLARE} value={r.glareSensitivity ?? null} onChange={set('glareSensitivity')} /></Field>
        <Field label="Sports" hint="Select all that apply.">
          <ChoiceChips multiple options={[...new Set([...SPORTS, ...(r.sports ?? [])])]} value={r.sports ?? []} onChange={set('sports')} />
        </Field>
        <Field label="Hobbies" hint="Select all that apply.">
          <ChoiceChips multiple options={[...new Set([...HOBBIES, ...(r.hobbies ?? [])])]} value={r.hobbies ?? []} onChange={set('hobbies')} />
        </Field>
        <Field label="What matters most in their glasses?"><ChoiceChips options={CONCERN} value={r.primaryConcern ?? null} onChange={set('primaryConcern')} /></Field>
        <Field label="Pairs they wear today">
          <ChoiceChips
            options={PAIRS}
            value={r.existingPairs == null ? null : String(Math.min(3, r.existingPairs))}
            onChange={(k: string | null) => setR((p) => ({ ...p, existingPairs: k == null ? undefined : Number(k) }))}
          />
        </Field>
      </View>
    </Sheet>
  );
}
