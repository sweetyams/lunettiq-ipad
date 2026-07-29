import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Sheet, FieldLabel, Chip, Button } from '@/src/ui';
import { useUpdateClient } from '@/src/api/useClients';

interface ContactEditSheetProps {
  clientId: string;
  client: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  visible: boolean;
  onClose: () => void;
}

export function ContactEditSheet({ clientId, client, visible, onClose }: ContactEditSheetProps) {
  const [firstName, setFirstName] = useState(client.firstName || '');
  const [lastName, setLastName] = useState(client.lastName || '');
  const [email, setEmail] = useState(client.email || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [language, setLanguage] = useState<'EN' | 'FR'>('EN');
  const [homeStore, setHomeStore] = useState<'Plateau' | 'DIX30' | 'Online'>('Plateau');

  const updateClient = useUpdateClient();

  const handleSave = async () => {
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
      onClose();
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFirstName(client.firstName || '');
    setLastName(client.lastName || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    onClose();
  };

  const footer = (
    <View className="flex-row gap-md">
      <Button variant="quiet" onPress={handleCancel}>
        Cancel
      </Button>
      <Button variant="primary" onPress={handleSave} disabled={updateClient.isPending}>
        {updateClient.isPending ? 'Saving...' : 'Save contact'}
      </Button>
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={handleCancel}
      title="Edit contact"
      footer={footer}
    >
      <View className="gap-lg">
        {/* Name row */}
        <View className="flex-row gap-md">
          <View className="flex-1">
            <FieldLabel>First name</FieldLabel>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
            />
          </View>
          <View className="flex-1">
            <FieldLabel>Last name</FieldLabel>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
            />
          </View>
        </View>

        {/* Email */}
        <View>
          <FieldLabel>Email</FieldLabel>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
          />
        </View>

        {/* Phone + Language */}
        <View className="flex-row gap-md">
          <View className="flex-1">
            <FieldLabel>Phone</FieldLabel>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="(514) 555-0123"
              keyboardType="phone-pad"
              className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
            />
          </View>
          <View className="flex-1">
            <FieldLabel>Language</FieldLabel>
            <View className="flex-row gap-sm">
              <Chip
                label="EN"
                variant={language === 'EN' ? 'on' : 'default'}
                onPress={() => setLanguage('EN')}
              />
              <Chip
                label="FR"
                variant={language === 'FR' ? 'on' : 'default'}
                onPress={() => setLanguage('FR')}
              />
            </View>
          </View>
        </View>

        {/* Home store */}
        <View>
          <FieldLabel>Home store</FieldLabel>
          <View className="flex-row gap-sm">
            <Chip
              label="Plateau"
              variant={homeStore === 'Plateau' ? 'on' : 'default'}
              onPress={() => setHomeStore('Plateau')}
            />
            <Chip
              label="DIX30"
              variant={homeStore === 'DIX30' ? 'on' : 'default'}
              onPress={() => setHomeStore('DIX30')}
            />
            <Chip
              label="Online only"
              variant={homeStore === 'Online' ? 'on' : 'default'}
              onPress={() => setHomeStore('Online')}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}