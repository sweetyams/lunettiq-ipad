import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { X, AlertTriangle, Users } from 'lucide-react-native';
import { useCreateClient, useTriggerDuplicateCheck } from '@/src/api/useCreateClient';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { Button, Card } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredLanguage: 'en' | 'fr';
  notes: string;
}

interface DuplicateClient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  fullName: string;
}

export default function NewClientScreen() {
  const router = useRouter();
  const isOnline = useSyncStore((s) => s.isOnline);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredLanguage: 'en',
    notes: '',
  });

  const [duplicates, setDuplicates] = useState<DuplicateClient[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const createClient = useCreateClient();
  const triggerDuplicateCheck = useTriggerDuplicateCheck();

  // Check for duplicates when name/email/phone changes
  useEffect(() => {
    const checkDuplicates = async () => {
      const { firstName, lastName, email, phone } = formData;
      
      // Only check if we have enough info and are online
      if (!isOnline || (!firstName.trim() && !lastName.trim() && !email.trim() && !phone.trim())) {
        setDuplicates([]);
        setShowDuplicateWarning(false);
        return;
      }

      setIsCheckingDuplicates(true);
      try {
        const result = await triggerDuplicateCheck({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        
        setDuplicates(result.duplicates);
        setShowDuplicateWarning(result.duplicates.length > 0);
      } catch (error) {
        console.warn('Duplicate check failed:', error);
        setDuplicates([]);
        setShowDuplicateWarning(false);
      } finally {
        setIsCheckingDuplicates(false);
      }
    };

    const timeoutId = setTimeout(checkDuplicates, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.firstName, formData.lastName, formData.email, formData.phone, isOnline, triggerDuplicateCheck]);

  const updateField = (field: keyof FormData) => (value: string | 'en' | 'fr') => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { firstName, lastName } = formData;
    
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'First name and last name are required.');
      return;
    }

    try {
      const newClient = await createClient.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        preferredLanguage: formData.preferredLanguage,
        notes: formData.notes.trim() || undefined,
      });

      router.replace(`/clients/${newClient.id}`);
    } catch (error) {
      toast.error('Error', 'Failed to create client. Please try again.');
    }
  };

  const handleUseExisting = (client: DuplicateClient) => {
    router.replace(`/clients/${client.id}`);
  };

  const handleSaveReminder = () => {
    toast.success('Reminder saved', 'We\'ll remind you to create this client when you\'re back online.');
    router.back();
  };

  if (!isOnline) {
    return (
      <View className="flex-1 bg-bg-page">
        {/* Header */}
        <View className="flex-row items-center justify-between px-xl py-lg bg-bg-elevated border-b border-border">
          <Pressable 
            onPress={() => router.back()}
            className="min-w-[44px] min-h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={24} color="#2B2B2B" />
          </Pressable>
          <Text className="text-headline font-semibold text-center">New Client</Text>
          <View className="w-[44px]" />
        </View>

        {/* Offline message */}
        <View className="flex-1 px-xl py-xl justify-center">
          <Card className="items-center p-xl">
            <AlertTriangle size={48} color="#D4A017" className="mb-lg" />
            <Text className="text-headline font-semibold text-center mb-sm">Internet Required</Text>
            <Text className="text-body text-center text-text-muted mb-lg">
              Client creation requires internet for duplicate checking
            </Text>
            <Button variant="secondary" onPress={handleSaveReminder}>
              Save reminder
            </Button>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="flex-row items-center justify-between px-xl py-lg bg-bg-elevated border-b border-border">
        <Pressable 
          onPress={() => router.back()}
          className="min-w-[44px] min-h-[44px] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={24} color="#2B2B2B" />
        </Pressable>
        <Text className="text-headline font-semibold">New Client</Text>
        <View className="w-[44px]" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-xl py-lg">
          {/* Duplicate warning */}
          {showDuplicateWarning && (
            <Card className="mb-lg bg-warning/10 border-warning">
              <View className="flex-row items-start">
                <Users size={20} color="#D4A017" className="mt-xs mr-sm" />
                <View className="flex-1">
                  <Text className="text-bodyStrong font-medium text-text-primary mb-xs">
                    Similar clients found
                  </Text>
                  {duplicates.map((duplicate) => (
                    <View key={duplicate.id} className="flex-row items-center justify-between mb-xs">
                      <Text className="text-body text-text-primary flex-1">
                        {duplicate.fullName}
                        {duplicate.email && ` • ${duplicate.email}`}
                      </Text>
                      <Pressable
                        onPress={() => handleUseExisting(duplicate)}
                        className="bg-brand rounded-md px-md py-xs min-h-[44px] justify-center"
                        accessibilityRole="button"
                      >
                        <Text className="text-caption font-medium text-text-inverse">Use existing</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          )}

          {/* Form */}
          <Card>
            <View className="space-y-lg">
              {/* First name - Required */}
              <View>
                <Text className="text-bodyStrong font-medium text-text-primary mb-xs">
                  First name *
                </Text>
                <TextInput
                  value={formData.firstName}
                  onChangeText={updateField('firstName')}
                  placeholder="Enter first name"
                  className="bg-bg-elevated border border-border rounded-md px-md py-sm text-body text-text-primary min-h-[44px]"
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="First name"
                />
              </View>

              {/* Last name - Required */}
              <View>
                <Text className="text-bodyStrong font-medium text-text-primary mb-xs">
                  Last name *
                </Text>
                <TextInput
                  value={formData.lastName}
                  onChangeText={updateField('lastName')}
                  placeholder="Enter last name"
                  className="bg-bg-elevated border border-border rounded-md px-md py-sm text-body text-text-primary min-h-[44px]"
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="Last name"
                />
              </View>

              {/* Email */}
              <View>
                <Text className="text-bodyStrong font-medium text-text-primary mb-xs">Email</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={updateField('email')}
                  placeholder="client@example.com"
                  className="bg-bg-elevated border border-border rounded-md px-md py-sm text-body text-text-primary min-h-[44px]"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email address"
                />
              </View>

              {/* Phone */}
              <View>
                <Text className="text-bodyStrong font-medium text-text-primary mb-xs">Phone</Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={updateField('phone')}
                  placeholder="(514) 555-0123"
                  className="bg-bg-elevated border border-border rounded-md px-md py-sm text-body text-text-primary min-h-[44px]"
                  keyboardType="phone-pad"
                  accessibilityLabel="Phone number"
                />
              </View>

              {/* Preferred language */}
              <View>
                <Text className="text-bodyStrong font-medium text-text-primary mb-xs">
                  Preferred language
                </Text>
                <View className="flex-row">
                  <Pressable
                    onPress={() => updateField('preferredLanguage')('en')}
                    className={`flex-1 py-sm px-md rounded-l-md border border-r-0 border-border min-h-[44px] items-center justify-center ${
                      formData.preferredLanguage === 'en' ? 'bg-brand' : 'bg-bg-elevated'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel="English"
                  >
                    <Text className={`text-body font-medium ${
                      formData.preferredLanguage === 'en' ? 'text-text-inverse' : 'text-text-primary'
                    }`}>
                      English
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => updateField('preferredLanguage')('fr')}
                    className={`flex-1 py-sm px-md rounded-r-md border border-border min-h-[44px] items-center justify-center ${
                      formData.preferredLanguage === 'fr' ? 'bg-brand' : 'bg-bg-elevated'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel="French"
                  >
                    <Text className={`text-body font-medium ${
                      formData.preferredLanguage === 'fr' ? 'text-text-inverse' : 'text-text-primary'
                    }`}>
                      Français
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Notes */}
              <View>
                <Text className="text-bodyStrong font-medium text-text-primary mb-xs">Notes</Text>
                <TextInput
                  value={formData.notes}
                  onChangeText={updateField('notes')}
                  placeholder="Optional notes..."
                  className="bg-bg-elevated border border-border rounded-md px-md py-sm text-body text-text-primary"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Notes"
                />
              </View>
            </View>
          </Card>

          {/* Submit button */}
          <View className="mt-lg">
            <Button
              variant="primary"
              onPress={handleSubmit}
              loading={createClient.isPending || isCheckingDuplicates}
              disabled={!formData.firstName.trim() || !formData.lastName.trim()}
            >
              Create Client
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}