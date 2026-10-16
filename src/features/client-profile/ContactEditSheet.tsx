import { View } from 'react-native';
import { useState } from 'react';
import { Sheet, TextField, formatPhone } from '@/src/ui/kit';
import { useUpdateClient } from '@/src/api/useClients';
import { toast } from '@/src/ui/useToastStore';

interface ContactEditSheetProps {
  clientId: string;
  client: { firstName: string | null; lastName: string | null; email: string | null; phone: string | null };
  visible: boolean;
  onClose: () => void;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactEditSheet({ clientId, client, visible, onClose }: ContactEditSheetProps) {
  const [firstName, setFirstName] = useState(client.firstName || '');
  const [lastName, setLastName] = useState(client.lastName || '');
  const [email, setEmail] = useState(client.email || '');
  const [phone, setPhone] = useState(formatPhone(client.phone) ?? '');
  const updateClient = useUpdateClient();

  const emailError = email.trim() && !EMAIL.test(email.trim()) ? 'That doesn’t look like an email address.' : null;
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneError = phone.trim() && phoneDigits.length < 10 ? 'Use 10 digits, e.g. 514-555-0123.' : null;

  const save = async () => {
    try {
      await updateClient.mutateAsync({
        id: clientId,
        data: {
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          email: email.trim() || null,
          phone: phone.trim() || null,
        },
      });
      toast.success('Contact saved');
      onClose();
    } catch {
      toast.error('Couldn’t save contact', 'Check the connection and try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Edit contact"
      primary={{ label: 'Save contact', onPress: save, disabled: !!(emailError || phoneError), loading: updateClient.isPending }}
    >
      <View className="gap-[20px]">
        <View className="flex-row gap-[16px]">
          <TextField className="flex-1" label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" textContentType="givenName" />
          <TextField className="flex-1" label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" textContentType="familyName" />
        </View>
        <TextField label="Email" value={email} onChangeText={setEmail} error={emailError} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
        <TextField label="Mobile" value={phone} onChangeText={setPhone} error={phoneError} hint="For pickup and appointment texts." placeholder="514-555-0123" keyboardType="phone-pad" textContentType="telephoneNumber" />
      </View>
    </Sheet>
  );
}
