import { useState } from 'react';
import { View, Text } from 'react-native';
import { Sheet } from '@/src/ui/kit';
import { PinPad } from '@/src/ui/PinPad';
import { useSetPin } from '@/src/api/useDeviceAuth';
import { toast } from '@/src/ui/useToastStore';

const WEAK = new Set(['1234', '4321', '0123', '3210', '1111', '0000', '2580', '1212']);

/** Choose and confirm a 4-digit quick-switch PIN for a staff member. */
export function PinSetupSheet({ visible, onClose, staffId, name }: {
  visible: boolean;
  onClose: () => void;
  staffId: string | null;
  name: string;
}) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setPin = useSetPin();

  const close = () => { setStep('enter'); setFirst(''); setError(null); onClose(); };

  const onComplete = (pin: string) => {
    if (step === 'enter') {
      if (/^(\d)\1{3}$/.test(pin) || WEAK.has(pin)) {
        setError('Too easy to guess. Avoid repeats and sequences.');
        return;
      }
      setFirst(pin);
      setStep('confirm');
      setError(null);
      return;
    }
    if (pin !== first) {
      setError('Those didn’t match. Start again.');
      setStep('enter');
      setFirst('');
      return;
    }
    if (!staffId) {
      setError('Your staff profile hasn’t loaded yet. Try again in a moment.');
      return;
    }
    setPin.mutate({ staffId, pin }, {
      onSuccess: () => { toast.success('PIN saved', 'Use it to unlock and switch to you on shared iPads.'); close(); },
      onError: () => setError('Couldn’t save the PIN. Check the connection and try again.'),
    });
  };

  return (
    <Sheet visible={visible} onClose={close} title={step === 'enter' ? `Choose a PIN for ${name}` : 'Enter it again'} subtitle="4 digits. Unlocks this iPad as you, and switches users on shared devices.">
      <View className="items-center py-[8px]">
        <PinPad title={step === 'enter' ? 'New PIN' : 'Confirm PIN'} onComplete={onComplete} error={error} disabled={setPin.isPending} />
        {setPin.isPending ? <Text className="text-body-sm text-text-tertiary mt-[12px]">Saving…</Text> : null}
      </View>
    </Sheet>
  );
}
