import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as Application from 'expo-application';
import { KeyRound, LogOut, RefreshCw } from 'lucide-react-native';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { useStaffProfile } from '@/src/features/auth/useStaffProfile';
import { PinSetupSheet } from '@/src/features/auth/PinSetupSheet';
import { useTenantStore, type Project } from '@/src/features/tenant/useTenantStore';
import { switchProject } from '@/src/features/tenant/switchProject';
import { useDeviceLocationStore, useDeviceLocationId } from '@/src/features/tenant/useDeviceLocationStore';
import { useLocations, locationName } from '@/src/api/useLocations';
import { LocationPickerSheet } from '@/src/features/client-profile/LocationPickerSheet';
import { useDeviceSettings, type LockTimeout } from '@/src/features/auth/useDeviceSettings';
import { useInitialSync } from '@/src/sync/useInitialSync';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { getDatabaseStats, resetDatabase } from '@/src/db';
import { Avatar } from '@/src/ui/Avatar';
import { useLangStore, useT, type Lang } from '@/src/i18n';
import { toast } from '@/src/ui/useToastStore';
import { Badge, Button, ChoiceChips, KeyValue, ListRow, PageHeader, Section, StatusDot, kitColors } from '@/src/ui/kit';

const AUTO_LOCK: Array<{ key: string; label: string }> = [
  { key: '2', label: '2 min' }, { key: '5', label: '5 min' }, { key: '10', label: '10 min' }, { key: 'never', label: 'Never' },
];

function ago(ts: number | null): string | null {
  if (!ts) return null;
  const min = Math.round((Date.now() - ts) / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  return new Date(ts).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Profile and device settings (Builder settings panel): you, store, sync, about. */
export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { activeOperator } = useOperatorStore();
  const { staffId: ownerStaffId } = useStaffProfile();

  const activeProject = useTenantStore((s) => s.activeProject);
  const knownProjects = useTenantStore((s) => s.knownProjects);
  const switchable = knownProjects.filter((p) => p.slug !== activeProject?.slug && p.ipadReady !== false);
  const isManager = activeProject?.role === 'admin' || activeProject?.role === 'owner';

  const deviceLocationId = useDeviceLocationId();
  const setDeviceLocation = useDeviceLocationStore((s) => s.setLocation);
  const { data: locations } = useLocations();
  const lockTimeout = useDeviceSettings((s) => s.lockTimeout);
  const setLockTimeout = useDeviceSettings((s) => s.setLockTimeout);

  const sync = useSyncStore();
  const { startSync, status: syncStatus, message: syncMessage } = useInitialSync();
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  useEffect(() => { getDatabaseStats().then(setDbStats).catch(() => {}); }, []);

  const uiLang = useLangStore((s) => s.uiLang);
  const setUiLang = useLangStore((s) => s.setUiLang);
  const tr = useT();
  const [locationOpen, setLocationOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [armed, setArmed] = useState<'signout' | 'switch' | 'reset' | null>(null);

  const name = activeOperator?.name || user?.fullName || 'Staff member';
  const [first, ...rest] = name.split(' ');
  const email = activeOperator?.email || user?.primaryEmailAddress?.emailAddress || '';
  const role = (activeOperator?.role ?? activeProject?.role ?? 'staff').replace(/_/g, ' ');
  const location = locations?.find((l) => l.id === deviceLocationId);
  const pending = sync.pendingWrites + sync.pendingUploads;
  const syncing = syncStatus === 'syncing';

  const changeStore = async (target: Project) => {
    try {
      await switchProject(target);
      await startSync();
      router.replace('/(app)/home');
    } catch {
      toast.error('Couldn’t change store', 'Check the connection and try again.');
    }
  };
  const onChangeStore = () => {
    if (switchable.length > 1) { router.push('/select-project'); return; }
    if (armed !== 'switch') { setArmed('switch'); return; }
    setArmed(null);
    void changeStore(switchable[0]!);
  };

  const cachedRows = Object.entries(dbStats).filter(([, n]) => n > 0).map(([table, n]) => ({ label: table.replace(/_/g, ' '), value: n.toLocaleString() }));

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader title="Profile" subtitle={activeProject ? `${activeProject.name}${location ? ` · ${locationName(location)}` : ''}` : undefined} />
      <ScrollView contentContainerStyle={{ padding: 32, paddingBottom: 140 }}>
        <View className="flex-row gap-[24px] items-start">
          <View className="flex-1 gap-[20px]">
            <Section title="You">
              <View className="flex-row items-center gap-[16px]">
                <Avatar firstName={first ?? ''} lastName={rest.join(' ')} size="lg" />
                <View className="flex-1 gap-[4px]">
                  <Text className="text-heading-lg text-text-primary">{name}</Text>
                  {email ? <Text className="text-body-md text-text-tertiary">{email}</Text> : null}
                  <View className="flex-row"><Badge>{role.charAt(0).toUpperCase() + role.slice(1)}</Badge></View>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-[8px] mt-[20px]">
                <Button label="Set or change PIN" icon={KeyRound} onPress={() => setPinOpen(true)} />
                <Button
                  label={armed === 'signout' ? 'Tap again to sign out' : 'Sign out'}
                  icon={LogOut}
                  variant="danger"
                  onPress={() => (armed === 'signout' ? (setArmed(null), void signOut()) : setArmed('signout'))}
                />
              </View>
              <View className="mt-[20px] pt-[16px] border-t border-border gap-[8px]">
                <Text className="text-body-md font-medium text-text-primary">{tr('profile.language')}</Text>
                <ChoiceChips options={[{ key: 'en', label: 'English' }, { key: 'fr', label: 'Français' }]} value={uiLang} onChange={(l: Lang | null) => l && setUiLang(l)} />
                <Text className="text-body-sm text-text-tertiary">{tr('profile.languageHint')}</Text>
              </View>
              {armed === 'signout' ? <Text className="text-body-sm text-text-tertiary mt-[8px]">Signing out removes this iPad’s cached data for {activeProject?.name ?? 'the store'}.</Text> : null}
            </Section>

            {activeProject ? (
              <Section title="Store" padded={false}>
                <ListRow
                  divider={false}
                  title={activeProject.name}
                  subtitle={activeProject.env === 'demo' ? 'Demo store. Changes don’t reach real clients.' : `You are ${activeProject.role}`}
                  trailing={activeProject.env === 'demo' ? <Badge tone="warning" dot>Demo</Badge> : undefined}
                />
                {switchable.length ? (
                  <ListRow
                    title={armed === 'switch' ? `Tap again to switch to ${switchable[0]!.name}` : 'Change store'}
                    subtitle={pending ? `${pending} change${pending > 1 ? 's' : ''} not synced yet; they’ll wait until you’re back.` : switchable.length > 1 ? `${switchable.length} other stores` : `Switch to ${switchable[0]!.name}`}
                    onPress={onChangeStore}
                    chevron
                  />
                ) : null}
                <ListRow
                  title="This iPad’s location"
                  subtitle={location ? locationName(location) : deviceLocationId ? 'Selected location' : 'Not set'}
                  onPress={isManager ? () => setLocationOpen(true) : undefined}
                  chevron={isManager}
                  trailing={isManager ? undefined : <Text className="text-body-sm text-text-tertiary">Managers can change</Text>}
                />
                <View className="px-[20px] py-[14px] border-t border-border gap-[10px]">
                  <View className="flex-row items-baseline justify-between">
                    <Text className="text-body-md font-medium text-text-primary">Auto-lock</Text>
                    <Text className="text-body-sm text-text-tertiary">{lockTimeout === 'never' ? 'Test devices only' : 'After idle'}</Text>
                  </View>
                  {isManager ? (
                    <ChoiceChips
                      options={AUTO_LOCK}
                      value={String(lockTimeout)}
                      onChange={(k: string | null) => k && setLockTimeout((k === 'never' ? 'never' : Number(k)) as LockTimeout)}
                    />
                  ) : (
                    <Text className="text-body-sm text-text-tertiary">{lockTimeout === 'never' ? 'Never' : `${lockTimeout} min`} · managers can change</Text>
                  )}
                </View>
              </Section>
            ) : null}
          </View>

          <View className="flex-1 gap-[20px]">
            <Section title="Sync">
              <View className="flex-row items-center gap-[8px] mb-[8px]">
                <StatusDot tone={!sync.isOnline ? 'danger' : pending ? 'warning' : 'success'} />
                <Text className="text-body-md text-text-primary flex-1">
                  {!sync.isOnline ? 'Offline. Changes are saved on this iPad.' : syncing ? syncMessage || 'Syncing…' : pending ? `${pending} change${pending > 1 ? 's' : ''} waiting to sync` : 'Up to date'}
                </Text>
              </View>
              <KeyValue rows={[
                { label: 'Last sync', value: ago(sync.lastSyncAt) },
                { label: 'Last full sync', value: ago(sync.lastFullSyncAt) },
              ]} />
              <View className="flex-row items-center justify-between min-h-[48px] border-t border-border">
                <Text className="text-body-md text-text-primary">Sync automatically</Text>
                <Switch value={sync.autoSyncEnabled} onValueChange={sync.setAutoSyncEnabled} accessibilityLabel="Sync automatically" trackColor={{ true: kitColors.primary, false: kitColors.border }} />
              </View>
              <View className="flex-row items-center justify-between min-h-[48px] border-t border-border">
                <Text className="text-body-md text-text-primary">Upload photos on Wi-Fi only</Text>
                <Switch value={sync.wifiOnlyUploads} onValueChange={sync.setWifiOnlyUploads} accessibilityLabel="Upload photos on Wi-Fi only" trackColor={{ true: kitColors.primary, false: kitColors.border }} />
              </View>
              <View className="mt-[12px] flex-row">
                <Button label={syncing ? 'Syncing…' : 'Sync now'} icon={RefreshCw} onPress={async () => { await startSync(); getDatabaseStats().then(setDbStats).catch(() => {}); }} disabled={syncing || !sync.isOnline} />
              </View>
            </Section>

            <Section title="About">
              <KeyValue rows={[
                { label: 'App version', value: Application.nativeApplicationVersion ?? null },
                { label: 'Build', value: Application.nativeBuildVersion ?? null },
                { label: 'Store', value: activeProject ? `${activeProject.slug}${activeProject.env ? ` (${activeProject.env})` : ''}` : null },
              ]} />
            </Section>

            {__DEV__ ? (
              <Section title="Developer">
                {cachedRows.length ? <KeyValue mono rows={cachedRows} /> : <Text className="text-body-sm text-text-tertiary">Nothing cached.</Text>}
                <View className="mt-[12px] flex-row">
                  <Button
                    label={armed === 'reset' ? 'Tap again to clear' : 'Clear local cache'}
                    variant="danger"
                    size="sm"
                    onPress={async () => {
                      if (armed !== 'reset') { setArmed('reset'); return; }
                      setArmed(null);
                      await resetDatabase();
                      setDbStats(await getDatabaseStats());
                      toast.info('Cache cleared', 'Sync to reload data.');
                    }}
                  />
                </View>
              </Section>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <LocationPickerSheet
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelect={(id) => activeProject && setDeviceLocation(activeProject.slug, id)}
        selectedLocationId={deviceLocationId}
        title="This iPad’s location"
      />
      {pinOpen ? (
        <PinSetupSheet visible onClose={() => setPinOpen(false)} staffId={activeOperator?.staffId ?? ownerStaffId ?? null} name={first ?? 'you'} />
      ) : null}
    </View>
  );
}
