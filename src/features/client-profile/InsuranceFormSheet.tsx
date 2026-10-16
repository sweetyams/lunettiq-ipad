import { View } from 'react-native';
import { useState, useEffect } from 'react';
import { Sheet, TextField, Field, ChoiceChips, KeyValue, formatDollars, formatDate } from '@/src/ui/kit';
import { useInsuranceProfile, useSaveInsurance } from '@/src/api/useMultiPair';
import { toast } from '@/src/ui/useToastStore';

interface InsuranceFormSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

const PROVIDERS = ['Desjardins', 'Sun Life', 'Manulife', 'Canada Life', 'Blue Cross', 'Green Shield'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function InsuranceFormSheet({ clientId, visible, onClose }: InsuranceFormSheetProps) {
  const { data: existing, isLoading } = useInsuranceProfile(clientId);
  const saveInsurance = useSaveInsurance();

  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [coverage, setCoverage] = useState('');
  const [pairsAllowed, setPairsAllowed] = useState('1');
  const [pairsUsed, setPairsUsed] = useState('0');
  const [renewal, setRenewal] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!existing?.provider) return;
    setProvider(existing.provider);
    setPolicyNumber(existing.policyNumber ?? '');
    setCoverage(existing.coverageAmount != null ? String(existing.coverageAmount) : '');
    setPairsAllowed(String(existing.pairsAllowed));
    setPairsUsed(String(existing.pairsUsed));
    setRenewal(existing.renewalDate?.slice(0, 10) ?? '');
    setNotes(existing.notes ?? '');
  }, [existing]);

  const allowed = parseInt(pairsAllowed, 10) || 0;
  const used = parseInt(pairsUsed, 10) || 0;
  const amount = parseFloat(coverage) || 0;
  const usedError = used > allowed ? 'More than the plan allows.' : null;
  const renewalError = renewal.trim() && (!ISO_DATE.test(renewal.trim()) || Number.isNaN(Date.parse(renewal.trim()))) ? 'Use YYYY-MM-DD, e.g. 2027-01-01.' : null;
  const canSave = !!provider.trim() && allowed > 0 && !usedError && !renewalError;

  const save = async () => {
    try {
      await saveInsurance.mutateAsync({
        customerId: clientId,
        provider: provider.trim(),
        policyNumber: policyNumber.trim() || undefined,
        coverageAmount: amount || undefined,
        pairsAllowed: allowed,
        pairsUsed: used,
        renewalDate: renewal.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success('Insurance saved');
      onClose();
    } catch {
      toast.error('Couldn’t save insurance', 'Check the connection and try again.');
    }
  };

  const perPair = allowed > 0 ? amount / allowed : 0;
  const left = Math.max(0, allowed - used);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Insurance"
      subtitle="Vision coverage, used to plan second pairs."
      primary={{ label: 'Save insurance', onPress: save, disabled: !canSave || isLoading, loading: saveInsurance.isPending }}
    >
      <View className="gap-[20px]">
        <Field label="Provider" required>
          <ChoiceChips options={PROVIDERS} value={PROVIDERS.includes(provider) ? provider : null} onChange={(p: string | null) => setProvider(p ?? '')} />
        </Field>
        <TextField label="Other provider" hint="If not listed above." value={PROVIDERS.includes(provider) ? '' : provider} onChangeText={setProvider} placeholder="Provider name" />
        <View className="flex-row gap-[16px]">
          <TextField className="flex-1" label="Policy number" value={policyNumber} onChangeText={setPolicyNumber} autoCapitalize="characters" autoCorrect={false} />
          <TextField className="flex-1" label="Coverage ($)" hint="Total for the period." value={coverage} onChangeText={setCoverage} keyboardType="decimal-pad" placeholder="300" />
        </View>
        <View className="flex-row gap-[16px]">
          <TextField className="flex-1" label="Pairs allowed" value={pairsAllowed} onChangeText={setPairsAllowed} keyboardType="number-pad" />
          <TextField className="flex-1" label="Pairs used" value={pairsUsed} onChangeText={setPairsUsed} error={usedError} keyboardType="number-pad" />
          <TextField className="flex-1" label="Renews" value={renewal} onChangeText={setRenewal} error={renewalError} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        </View>
        <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="e.g. Shared with spouse; needs receipt itemised" multiline />
        {allowed > 0 ? (
          <Field label="Summary">
            <View className="border border-border rounded-md px-[16px]">
              <KeyValue
                mono
                rows={[
                  { label: 'Pairs left', value: `${left} of ${allowed}` },
                  { label: 'Coverage left', value: amount ? formatDollars(Math.max(0, amount - perPair * used)) : null },
                  { label: 'Renews', value: renewalError ? null : formatDate(renewal.trim() ? `${renewal.trim()}T12:00:00` : null) },
                ]}
              />
            </View>
          </Field>
        ) : null}
      </View>
    </Sheet>
  );
}
