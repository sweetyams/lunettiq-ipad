import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, WifiOff } from 'lucide-react-native';
import { useCreateClient, useTriggerDuplicateCheck } from '@/src/api/useCreateClient';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { Avatar } from '@/src/ui/Avatar';
import { Button, ChoiceChips, Field, ListRow, Section, TextField, kitColors, formatPhone } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import { APIError } from '@/src/api/client';
import type { DuplicateClient } from '@/src/api/duplicateCheck';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredLanguage: 'en' | 'fr';
  notes: string;
}


const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewClientScreen() {
  const router = useRouter();
  const isOnline = useSyncStore((s) => s.isOnline);
  const [form, setForm] = useState<FormData>({ firstName: '', lastName: '', email: '', phone: '', preferredLanguage: 'en', notes: '' });
  const [duplicates, setDuplicates] = useState<DuplicateClient[]>([]);
  const [checking, setChecking] = useState(false);
  const createClient = useCreateClient();
  const triggerDuplicateCheck = useTriggerDuplicateCheck();

  // Look for an existing profile as they type (debounced).
  useEffect(() => {
    const { firstName, lastName, email, phone } = form;
    if (!isOnline || (!firstName.trim() && !lastName.trim() && !email.trim() && !phone.trim())) {
      setDuplicates([]);
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await triggerDuplicateCheck({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        setDuplicates(result.duplicates);
      } catch {
        setDuplicates([]);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.firstName, form.lastName, form.email, form.phone, isOnline, triggerDuplicateCheck]);

  const set = (k: keyof FormData) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const emailError = form.email.trim() && !EMAIL.test(form.email.trim()) ? 'That doesn’t look like an email address.' : null;
  const phoneError = form.phone.trim() && form.phone.replace(/\D/g, '').length < 10 ? 'Use 10 digits, e.g. 514-555-0123.' : null;
  const canCreate = !!form.firstName.trim() && !!form.lastName.trim() && !emailError && !phoneError;

  const submit = async () => {
    try {
      const created = await createClient.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        preferredLanguage: form.preferredLanguage,
        notes: form.notes.trim() || undefined,
      });
      toast.success('Client created', `${form.firstName.trim()} ${form.lastName.trim()}`);
      router.replace(`/clients/${created.id}`);
    } catch (e) {
      // Foundry has no staff create-client route yet (GET-only /api/clients): 404/405.
      if (e instanceof APIError && (e.status === 404 || e.status === 405)) {
        toast.error('Can’t create clients from the iPad yet', 'Foundry needs a create-client endpoint. Start a visit from Floor for now.');
      } else {
        toast.error('Couldn’t create the client', 'Check the connection and try again. Nothing was lost.');
      }
    }
  };

  const header = (
    <View className="px-[32px] pt-[16px] pb-[20px] border-b border-border bg-bg-page">
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center self-start min-h-[44px] gap-[4px] -ml-[6px]"
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back to clients"
      >
        <ChevronLeft size={20} color={kitColors.textTertiary} />
        <Text className="text-body-md text-text-tertiary">Clients</Text>
      </Pressable>
      <View className="flex-row items-end justify-between gap-[16px] mt-[4px]">
        <View>
          <Text className="text-display-lg text-text-primary">New client</Text>
          <Text className="text-body-md text-text-tertiary mt-[4px]">Name is enough to start; add the rest during the visit.</Text>
        </View>
        {isOnline ? (
          <View className="flex-row gap-[8px]">
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
            <Button label="Create client" variant="primary" onPress={submit} disabled={!canCreate} loading={createClient.isPending} />
          </View>
        ) : null}
      </View>
    </View>
  );

  if (!isOnline) {
    return (
      <View className="flex-1 bg-bg-page">
        {header}
        <View className="flex-1 items-center justify-center px-[32px] gap-[12px]">
          <WifiOff size={32} color={kitColors.iconMuted} />
          <Text className="text-heading-lg text-text-primary">You’re offline</Text>
          <Text className="text-body-md text-text-tertiary text-center max-w-[480px]">
            Creating a client needs the internet so we can check they aren’t already on file. Try again when the connection is back.
          </Text>
          <Button label="Back to clients" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-page">
      {header}
      <ScrollView contentContainerStyle={{ padding: 32, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row gap-[24px] items-start">
          <View className="flex-[3]">
            <Section>
              <View className="gap-[20px]">
                <View className="flex-row gap-[16px]">
                  <TextField className="flex-1" label="First name" required value={form.firstName} onChangeText={set('firstName')} autoCapitalize="words" autoCorrect={false} textContentType="givenName" autoFocus />
                  <TextField className="flex-1" label="Last name" required value={form.lastName} onChangeText={set('lastName')} autoCapitalize="words" autoCorrect={false} textContentType="familyName" />
                </View>
                <View className="flex-row gap-[16px]">
                  <TextField className="flex-1" label="Email" value={form.email} onChangeText={set('email')} error={emailError} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
                  <TextField className="flex-1" label="Mobile" value={form.phone} onChangeText={set('phone')} error={phoneError} placeholder="514-555-0123" keyboardType="phone-pad" textContentType="telephoneNumber" />
                </View>
                <Field label="Language">
                  <ChoiceChips
                    options={[{ key: 'en', label: 'English' }, { key: 'fr', label: 'Français' }]}
                    value={form.preferredLanguage}
                    onChange={(v: 'en' | 'fr' | null) => setForm((f) => ({ ...f, preferredLanguage: v ?? f.preferredLanguage }))}
                  />
                </Field>
                <TextField label="Notes" hint="Staff only." value={form.notes} onChangeText={set('notes')} placeholder="e.g. Walked in for sunglasses, referred by Camille" multiline />
              </View>
            </Section>
          </View>

          <View className="flex-[2]">
            <Section title="Already a client?" count={duplicates.length || undefined} padded={duplicates.length === 0}>
              {duplicates.length === 0 ? (
                <Text className="text-body-sm text-text-tertiary">
                  {checking ? 'Checking…' : 'Matches by name, email or phone show up here as you type.'}
                </Text>
              ) : (
                duplicates.map((d, i) => (
                  <ListRow
                    key={d.id}
                    divider={i > 0}
                    leading={<Avatar size="sm" firstName={d.firstName ?? ''} lastName={d.lastName ?? ''} />}
                    title={d.fullName || 'No name yet'}
                    subtitle={[d.reason === 'email' ? 'Same email' : d.reason === 'phone' ? 'Same phone' : 'Same name', d.email, formatPhone(d.phone)].filter(Boolean).join(' · ')}
                    trailing={<Button label="Open" size="sm" onPress={() => router.replace(`/clients/${d.id}`)} />}
                  />
                ))
              )}
            </Section>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
