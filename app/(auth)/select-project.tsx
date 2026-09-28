import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Store, ChevronRight } from 'lucide-react-native';
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
  const { startSync, status, message } = useInitialSync();
  const [selectingSlug, setSelectingSlug] = useState<string | null>(null);

  const isBusy = selectingSlug !== null;

  const handleSelect = async (project: Project): Promise<void> => {
    if (isBusy) return;
    setSelectingSlug(project.slug);
    try {
      await switchProject(project);
      await startSync();
      router.replace('/(app)/home');
    } catch {
      // switchProject/sync failure — reset so the user can retry.
      setSelectingSlug(null);
    }
  };

  return (
    <View className="flex-1 bg-bg-page">
      <ScrollView contentContainerClassName="px-8 py-2xl items-center">
        <View className="w-full max-w-[440px]">
          <View className="items-center mb-xl">
            <Text className="text-heading-xl text-text-primary">Choose a store</Text>
            <Text className="text-body-md text-text-muted mt-xs text-center">
              Your account has access to more than one store. Pick which one to work in.
            </Text>
          </View>

          <View className="gap-md">
            {knownProjects.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                busy={selectingSlug === project.slug}
                disabled={isBusy && selectingSlug !== project.slug}
                onPress={() => handleSelect(project)}
              />
            ))}
          </View>

          {isBusy && (
            <Text className="text-body-sm text-text-muted mt-lg text-center">
              {status === 'syncing' && message ? message : 'Opening store…'}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface ProjectCardProps {
  project: Project;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}

function ProjectCard({ project, busy, disabled, onPress }: ProjectCardProps) {
  const isDemo = project.env === 'demo';
  const locationCount = project.locationIds.length;
  const locationLabel =
    locationCount === 0
      ? 'No locations'
      : `${locationCount} location${locationCount > 1 ? 's' : ''}`;

  const a11yLabel = `${project.name}, role ${project.role}, ${locationLabel}${
    isDemo ? ', demo store' : ''
  }`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      className={`flex-row items-center gap-md bg-bg-surface rounded-lg border border-border p-md min-h-[44px] ${
        disabled ? 'opacity-40' : ''
      }`}
      style={({ pressed }) => ({ opacity: pressed && !disabled && !busy ? 0.8 : undefined })}
    >
      <View className="w-11 h-11 rounded-md bg-brand items-center justify-center">
        {project.brandMark ? (
          <Text className="text-brand-text text-heading-sm font-bold">{project.brandMark}</Text>
        ) : (
          <Store size={22} color="#FFFFFF" />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-sm">
          <Text className="text-heading-sm text-text-primary">{project.name}</Text>
          {isDemo && (
            <View className="px-[8px] py-[2px] rounded-sm bg-warning">
              <Text className="text-caption-sm text-text-inverse uppercase tracking-[0.08em]">
                Demo
              </Text>
            </View>
          )}
        </View>
        <Text className="text-body-sm text-text-muted mt-xs capitalize">
          {project.role} · {locationLabel}
        </Text>
      </View>

      {busy ? (
        <ActivityIndicator size="small" color="#1D1F21" />
      ) : (
        <ChevronRight size={20} color="#737373" />
      )}
    </Pressable>
  );
}
