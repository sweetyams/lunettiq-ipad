import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Application from 'expo-application';
import { Cloud, CloudOff, RefreshCw, Trash2, User, Info, Wifi } from 'lucide-react-native';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { useInitialSync } from '@/src/sync/useInitialSync';
import { getDatabaseStats, resetDatabase } from '@/src/db';
import { usePermissions } from '@/src/features/auth/usePermissions';
import { Button } from '@/src/ui/Button';
import { ScreenHeader } from '@/src/ui/ScreenHeader';

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
              <Text className="text-body text-text-primary ml-md flex-1">
                {isOnline ? 'Connected' : 'Offline'}
              </Text>
              <Text className="text-caption text-text-muted">
                {isConnectedToWifi ? 'WiFi' : isOnline ? 'Cellular' : 'No connection'}
              </Text>
            </View>

            {/* Last sync */}
            <View className="flex-row items-center px-lg py-md border-b border-border">
              <Text className="text-body text-text-primary flex-1">Last sync</Text>
              <Text className="text-caption text-text-muted">
                {formatTimestamp(lastSyncAt)}
              </Text>
            </View>

            {/* Last full sync */}
            <View className="flex-row items-center px-lg py-md border-b border-border">
              <Text className="text-body text-text-primary flex-1">Last full sync</Text>
              <Text className="text-caption text-text-muted">
                {formatTimestamp(lastFullSyncAt)}
              </Text>
            </View>

            {/* Pending */}
            <View className="flex-row items-center px-lg py-md border-b border-border">
              <Text className="text-body text-text-primary flex-1">Pending writes</Text>
              <Text className={`text-body ${pendingWrites > 0 ? 'text-warning' : 'text-text-muted'}`}>
                {pendingWrites}
              </Text>
            </View>

            <View className="flex-row items-center px-lg py-md border-b border-border">
              <Text className="text-body text-text-primary flex-1">Pending uploads</Text>
              <Text className={`text-body ${pendingUploads > 0 ? 'text-warning' : 'text-text-muted'}`}>
                {pendingUploads}
              </Text>
            </View>

            {/* Auto-sync toggle */}
            <View className="flex-row items-center px-lg py-md border-b border-border min-h-[44px]">
              <Text className="text-body text-text-primary flex-1">Auto-sync</Text>
              <Switch
                value={autoSyncEnabled}
                onValueChange={setAutoSyncEnabled}
                trackColor={{ true: '#005D23' }}
              />
            </View>

            {/* WiFi-only uploads toggle */}
            <View className="flex-row items-center px-lg py-md border-b border-border min-h-[44px]">
              <Wifi size={16} color="#6B6B6B" />
              <Text className="text-body text-text-primary ml-sm flex-1">Upload photos on WiFi only</Text>
              <Switch
                value={wifiOnlyUploads}
                onValueChange={setWifiOnlyUploads}
                trackColor={{ true: '#005D23' }}
              />
            </View>

            {/* Force sync button */}
            <View className="px-lg py-md">
              <Button
                variant="secondary"
                onPress={handleForceSync}
                disabled={syncingStatus === 'syncing'}
              >
                <View className="flex-row items-center gap-sm">
                  <RefreshCw size={16} color="white" />
                  <Text className="text-text-inverse text-bodyStrong">
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
            {Object.entries(dbStats).map(([key, value]) => (
              <View key={key} className="flex-row items-center px-lg py-sm border-b border-border">
                <Text className="text-body text-text-primary flex-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Text className="text-caption text-text-muted">{value}</Text>
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
                  <Text className="text-body text-destructive ml-sm">Clear local cache (DEV)</Text>
                </Pressable>
              </View>
            )}
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
                <Text className="text-body text-text-primary">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-caption text-text-muted">
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
            </View>

            {/* Permissions */}
            <View className="px-lg py-md border-b border-border">
              <Text className="text-bodyStrong text-text-primary mb-xs">Permissions</Text>
              <View className="flex-row flex-wrap gap-xs">
                {permissions.length > 0 ? (
                  permissions.map((perm) => (
                    <View key={perm} className="bg-warmGrey rounded-md px-sm py-xs">
                      <Text className="text-caption text-text-primary">
                        {perm.replace('org:', '')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-caption text-text-muted">No permissions found in token</Text>
                )}
              </View>
            </View>

            {/* Sign out */}
            <View className="px-lg py-md">
              <Pressable
                onPress={() => signOut()}
                className="flex-row items-center justify-center py-sm min-h-[44px]"
              >
                <Text className="text-body text-destructive">Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View>
          <Text className="text-displayMd text-text-primary mb-md">About</Text>
          <View className="bg-bg-surface rounded-lg border border-border">
            <View className="flex-row items-center px-lg py-sm border-b border-border">
              <Text className="text-body text-text-primary flex-1">App version</Text>
              <Text className="text-caption text-text-muted">
                {Application.nativeApplicationVersion || '0.1.0'}
              </Text>
            </View>
            <View className="flex-row items-center px-lg py-sm border-b border-border">
              <Text className="text-body text-text-primary flex-1">Build number</Text>
              <Text className="text-caption text-text-muted">
                {Application.nativeBuildVersion || '1'}
              </Text>
            </View>
            <View className="flex-row items-center px-lg py-sm">
              <Text className="text-body text-text-primary flex-1">Environment</Text>
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
