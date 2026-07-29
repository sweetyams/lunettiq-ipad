import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Application from 'expo-application';
import { Cloud, CloudOff, RefreshCw, Trash2, User, Info, Wifi, Lock } from 'lucide-react-native';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { useInitialSync } from '@/src/sync/useInitialSync';
import { getDatabaseStats, resetDatabase } from '@/src/db';
import { usePermissions } from '@/src/features/auth/usePermissions';
import { useStaffProfile } from '@/src/features/auth/useStaffProfile';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { useSetPin } from '@/src/api/useDeviceAuth';
import { PinPad } from '@/src/ui/PinPad';
import { Button } from '@/src/ui/Button';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { toast } from '@/src/ui/useToastStore';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { permissions } = usePermissions();
  const {
    isOnline,
    isConnectedToWifi,
    pendingWrites,
    pendingUploads,
    lastSyncAt,
    lastFullSyncAt,
    syncStatus,
    wifiOnlyUploads,
    autoSyncEnabled,
    setWifiOnlyUploads,
    setAutoSyncEnabled,
  } = useSyncStore();
  const { startSync, status: syncingStatus, progress, message: syncMessage } = useInitialSync();
  const [dbStats, setDbStats] = useState<Record<string, number>>({});

  // Load database stats
  useEffect(() => {
    getDatabaseStats().then(setDbStats).catch(() => {});
  }, []);

  const handleForceSync = async () => {
    await startSync();
    // Refresh stats after sync
    const stats = await getDatabaseStats();
    setDbStats(stats);
  };

  const handleClearCache = () => {
    if (!__DEV__) return;
    Alert.alert(
      'Clear Local Cache',
      'This will delete all locally cached data. You will need to re-sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await resetDatabase();
            const stats = await getDatabaseStats();
            setDbStats(stats);
          },
        },
      ]
    );
  };

  const formatTimestamp = (ts: number | null): string => {
    if (!ts) return 'Never';
    const date = new Date(ts);
    const now = Date.now();
    const diffMin = Math.round((now - ts) / 60_000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <ScrollView className="flex-1 bg-bg-page">
      {/* Header */}
      <ScreenHeader title="Settings" subtitle="Sync, device config, account" />

      <View className="p-xl gap-xl">
        {/* Sync Section */}
        <View>
          <Text className="text-displayMd text-text-primary mb-md">Sync</Text>
          <View className="bg-bg-surface rounded-lg border border-border">
            {/* Connection status */}
            <View className="flex-row items-center px-lg py-md border-b border-border">
              {isOnline ? (
                <Cloud size={18} color="#005D23" />
              ) : (
                <CloudOff size={18} color="#D4A017" />
              )}
              <Text className="text-body-md text-text-primary ml-md flex-1">
                {isOnline ? 'Connected' : 'Offline'}
              </Text>
              <Text className="text-caption-md text-text-muted">
                {isConnectedToWifi ? 'WiFi' : isOnline ? 'Cellular' : 'No connection'}
              </Text>
            </View>

            {/* Last sync */}
            <View className="flex-row items-center px-lg py-md border-b border-border">
              <Text className="text-body-md text-text-primary flex-1">Last sync</Text>
              <Text className="text-caption-md text-text-muted">
                {formatTimestamp(lastSyncAt)}
              </Text>
            </View>

            {/* Last full sync */}
            <View className="flex-row items-center px-lg py-md border-b border-border">
              <Text className="text-body-md text-text-primary flex-1">Last full sync</Text>
              <Text className="text-caption-md text-text-muted">
                {formatTimestamp(lastFullSyncAt)}
              </Text>
            </View>

            {/* Pending */}
            <View className="flex-row items-center px-lg py-md border-b border-border">
              <Text className="text-body-md text-text-primary flex-1">Pending writes</Text>
              <Text className={`text-body ${pendingWrites > 0 ? 'text-warning' : 'text-text-muted'}`}>
                {pendingWrites}
              </Text>
            </View>

            <View className="flex-row items-center px-lg py-md border-b border-border">
              <Text className="text-body-md text-text-primary flex-1">Pending uploads</Text>
              <Text className={`text-body ${pendingUploads > 0 ? 'text-warning' : 'text-text-muted'}`}>
                {pendingUploads}
              </Text>
            </View>

            {/* Auto-sync toggle */}
            <View className="flex-row items-center px-lg py-md border-b border-border min-h-[44px]">
              <Text className="text-body-md text-text-primary flex-1">Auto-sync</Text>
              <Switch
                value={autoSyncEnabled}
                onValueChange={setAutoSyncEnabled}
                trackColor={{ true: '#005D23' }}
              />
            </View>

            {/* WiFi-only uploads toggle */}
            <View className="flex-row items-center px-lg py-md min-h-[44px]">
              <Wifi size={16} color="#6B6B6B" />
              <Text className="text-body-md text-text-primary ml-sm flex-1">Upload photos on WiFi only</Text>
              <Switch
                value={wifiOnlyUploads}
                onValueChange={setWifiOnlyUploads}
                trackColor={{ true: '#005D23' }}
              />
            </View>

            {/* Force sync button */}
            <View className="px-lg py-md border-t border-border">
              <Button
                variant="dark"
                onPress={handleForceSync}
                disabled={syncingStatus === 'syncing'}
              >
                <View className="flex-row items-center gap-sm">
                  <RefreshCw size={16} color="white" />
                  <Text className="text-text-inverse text-body-md font-medium">
                    {syncingStatus === 'syncing' ? `Syncing... ${progress}%` : 'Force full sync'}
                  </Text>
                </View>
              </Button>
            </View>
          </View>
        </View>

        {/* Cache Section */}
        <View>
          <Text className="text-displayMd text-text-primary mb-md">Cache</Text>
          <View className="bg-bg-surface rounded-lg border border-border">
            {Object.entries(dbStats).map(([key, value], index, arr) => (
              <View key={key} className={`flex-row items-center px-lg py-sm ${index < arr.length - 1 ? 'border-b border-border' : ''}`}>
                <Text className="text-body-md text-text-primary flex-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Text className="text-caption-md text-text-muted">{value}</Text>
              </View>
            ))}

            {/* Clear cache (dev only) */}
            {__DEV__ && (
              <View className="px-lg py-md">
                <Pressable
                  onPress={handleClearCache}
                  className="flex-row items-center justify-center py-sm min-h-[44px]"
                >
                  <Trash2 size={16} color="#C53030" />
                  <Text className="text-body-md text-destructive ml-sm">Clear local cache (DEV)</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Quick Switch PIN */}
        <View>
          <Text className="text-displayMd text-text-primary mb-md">Quick Switch PIN</Text>
          <View className="bg-bg-surface rounded-lg border border-border">
            <PinSetupSection />
          </View>
        </View>

        {/* Account Section */}
        <View>
          <Text className="text-displayMd text-text-primary mb-md">Account</Text>
          <View className="bg-bg-surface rounded-lg border border-border">
            {/* Staff info */}
            <View className="flex-row items-center px-lg py-md border-b border-border">
              <User size={18} color="#2B2B2B" />
              <View className="ml-md flex-1">
                <Text className="text-body-md text-text-primary">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-caption-md text-text-muted">
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
            </View>

            {/* Permissions */}
            <View className="px-lg py-md">
              <Text className="text-body-md font-medium text-text-primary mb-xs">Permissions</Text>
              <View className="flex-row flex-wrap gap-xs">
                {permissions.length > 0 ? (
                  permissions.map((perm) => (
                    <View key={perm} className="bg-warmGrey rounded-md px-sm py-xs">
                      <Text className="text-caption-md text-text-primary">
                        {perm.replace('org:', '')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-caption-md text-text-muted">No permissions found in token</Text>
                )}
              </View>
            </View>

            {/* Sign out */}
            <View className="px-lg py-md border-t border-border">
              <Pressable
                onPress={() => signOut()}
                className="flex-row items-center justify-center py-sm min-h-[44px]"
              >
                <Text className="text-body-md text-destructive">Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View>
          <Text className="text-displayMd text-text-primary mb-md">About</Text>
          <View className="bg-bg-surface rounded-lg border border-border">
            <View className="flex-row items-center px-lg py-sm border-b border-border">
              <Text className="text-body-md text-text-primary flex-1">App version</Text>
              <Text className="text-caption-md text-text-muted">
                {Application.nativeApplicationVersion || '0.1.0'}
              </Text>
            </View>
            <View className="flex-row items-center px-lg py-sm border-b border-border">
              <Text className="text-body-md text-text-primary flex-1">Build number</Text>
              <Text className="text-caption-md text-text-muted">
                {Application.nativeBuildVersion || '1'}
              </Text>
            </View>
            <View className="flex-row items-center px-lg py-sm">
              <Text className="text-body-md text-text-primary flex-1">Environment</Text>
              <View className={`rounded-full px-sm py-xs ${__DEV__ ? 'bg-warning/20' : 'bg-green/20'}`}>
                <Text className={`text-caption ${__DEV__ ? 'text-warning' : 'text-green'}`}>
                  {__DEV__ ? 'Development' : 'Production'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// --- PIN Setup Section ---

function PinSetupSection() {
  const { staffId: deviceOwnerStaffId } = useStaffProfile();
  const { activeOperator } = useOperatorStore();
  // Use the active operator's staffId — this is who's actually setting the PIN
  const targetStaffId = activeOperator?.staffId ?? deviceOwnerStaffId;
  const targetName = activeOperator?.name ?? 'you';
  const { mutate: setPin, isPending } = useSetPin();
  const [showPinPad, setShowPinPad] = useState(false);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleStartSetup = useCallback(() => {
    setShowPinPad(true);
    setStep('enter');
    setFirstPin('');
    setPinError(null);
  }, []);

  const handlePinComplete = useCallback((pin: string) => {
    if (step === 'enter') {
      // Validate: no sequential or repeating
      if (/^(\d)\1{3}$/.test(pin)) {
        setPinError('PIN cannot be all the same digit');
        return;
      }
      if (pin === '1234' || pin === '4321' || pin === '0123' || pin === '3210') {
        setPinError('PIN cannot be sequential');
        return;
      }
      setFirstPin(pin);
      setStep('confirm');
      setPinError(null);
    } else {
      // Confirm step
      if (pin !== firstPin) {
        setPinError('PINs do not match. Try again.');
        setStep('enter');
        setFirstPin('');
        return;
      }

      // PINs match — save to server
      if (!targetStaffId) {
        setPinError('Staff profile not loaded');
        return;
      }

      setPin(
        { staffId: targetStaffId, pin },
        {
          onSuccess: () => {
            toast.success('PIN set', 'You can now use your PIN to unlock the device.');
            setShowPinPad(false);
            setStep('enter');
            setFirstPin('');
            setPinError(null);
          },
          onError: (error) => {
            setPinError(error instanceof Error ? error.message : 'Failed to set PIN');
          },
        }
      );
    }
  }, [step, firstPin, targetStaffId, setPin]);

  const handleCancel = useCallback(() => {
    setShowPinPad(false);
    setStep('enter');
    setFirstPin('');
    setPinError(null);
  }, []);

  if (!showPinPad) {
    return (
      <View className="px-lg py-md">
        <View className="flex-row items-center mb-sm">
          <Lock size={16} color="#404040" />
          <Text className="text-body-md text-text-primary ml-sm flex-1">
            Set a PIN for quick device switching
          </Text>
        </View>
        <Text className="text-caption-md text-text-muted mb-md">
          Your PIN lets you quickly switch to your identity on shared devices without a full sign-in.
        </Text>
        <Button variant="dark" onPress={handleStartSetup}>
          <Text className="text-text-inverse text-body-md font-medium">Set up PIN</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="px-lg py-md">
      <View className="flex-row items-center justify-between mb-md">
        <Text className="text-body-md font-medium text-text-primary">
          {step === 'enter' ? 'Enter a 4-digit PIN' : 'Confirm your PIN'}
        </Text>
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel PIN setup"
          className="min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <Text className="text-body-md text-text-muted">Cancel</Text>
        </Pressable>
      </View>
      <PinPad
        title={step === 'enter' ? 'Choose your PIN' : 'Enter the same PIN again'}
        onComplete={handlePinComplete}
        error={pinError}
        disabled={isPending}
      />
    </View>
  );
}
