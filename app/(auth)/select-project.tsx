import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Store } from 'lucide-react-native';
import { Badge, Button, ListRow, Section, kitColors } from '@/src/ui/kit';
import { useTenantStore, type Project } from '@/src/features/tenant/useTenantStore';
import { switchProject } from '@/src/features/tenant/switchProject';
import { useInitialSync } from '@/src/sync/useInitialSync';

/**
 * Select-project screen.
 *
 * Shown after Clerk sign-in when the user belongs to more than one project. Picking a
 * project sets it active (isolated DB + host repoint via switchProject), runs the initial
 * sync against that project's host, then enters the app.
 *
 * The 0-project and 1-project cases are handled by the gate in app/_layout.tsx and never
 * reach this screen.
 */
export default function SelectProjectScreen() {
  const router = useRouter();
  const knownProjects = useTenantStore((s) => s.knownProjects);
  const activeProject = useTenantStore((s) => s.activeProject);
  const { startSync, status, message } = useInitialSync();
  const [selectingSlug, setSelectingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBusy = selectingSlug !== null;
  // Reached via "Change store" (a store is already active) → allow backing out.
  const canCancel = activeProject != null;

  const handleSelect = async (project: Project): Promise<void> => {
    if (isBusy || project.ipadReady === false) return;
    if (project.slug === activeProject?.slug) {
      router.replace('/(app)/home');
      return;
    }
    setSelectingSlug(project.slug);
    setError(null);
    try {
      await switchProject(project);
      await startSync();
      router.replace('/(app)/home');
    } catch {
      setSelectingSlug(null);
      setError(`Couldn’t open ${project.name}. Check the connection and try again.`);
    }
  };

  return (
    <View className="flex-1 bg-bg-page">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingVertical: 64, alignItems: 'center' }}>
        <View className="w-full max-w-[520px] gap-[20px]">
          <View className="gap-[4px]">
            <Text className="text-display-lg text-text-primary">Choose a store</Text>
            <Text className="text-body-md text-text-tertiary">Your account works in more than one store. Pick the one this iPad is in.</Text>
          </View>

          <Section padded={false}>
            {knownProjects.map((project, i) => {
              const notReady = project.ipadReady === false;
              const busy = selectingSlug === project.slug;
              const current = project.slug === activeProject?.slug;
              return (
                <ListRow
                  key={project.slug}
                  divider={i > 0}
                  onPress={notReady || (isBusy && !busy) ? undefined : () => handleSelect(project)}
                  accessibilityLabel={`${project.name}${project.env === 'demo' ? ', demo store' : ''}${notReady ? ', not available on iPad' : ''}`}
                  leading={
                    <View className={`w-[44px] h-[44px] rounded-md bg-brand items-center justify-center ${notReady ? 'opacity-40' : ''}`}>
                      {project.brandMark ? <Text className="text-brand-text text-heading-lg">{project.brandMark}</Text> : <Store size={22} color={kitColors.inverse} />}
                    </View>
                  }
                  title={
                    <View className="flex-row items-center gap-[8px]">
                      <Text className={`text-body-lg font-medium ${notReady ? 'text-text-tertiary' : 'text-text-primary'}`}>{project.name}</Text>
                      {project.env === 'demo' ? <Badge tone="warning">Demo</Badge> : null}
                      {current ? <Badge tone="success" dot>Current</Badge> : null}
                    </View>
                  }
                  subtitle={notReady ? 'Not available on iPad yet' : `You are ${project.role}`}
                  trailing={busy ? <ActivityIndicator color={kitColors.primary} /> : undefined}
                  chevron={!notReady && !busy}
                />
              );
            })}
          </Section>

          {isBusy ? <Text className="text-body-sm text-text-tertiary">{status === 'syncing' && message ? message : 'Opening store…'}</Text> : null}
          {error ? <Text className="text-body-sm text-error">{error}</Text> : null}
          {canCancel && !isBusy ? (
            <View className="flex-row"><Button label="Cancel" variant="ghost" onPress={() => router.replace('/(app)/home')} /></View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
