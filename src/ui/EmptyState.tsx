import { View, Text } from 'react-native';
import type { ComponentType } from 'react';
import { Inbox } from 'lucide-react-native';
import { Button } from '@/src/ui/kit/Button';
import { kitColors } from '@/src/ui/kit/colors';

interface EmptyStateProps {
  message: string;
  title?: string;
  icon?: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  actionLabel?: string;
  onAction?: () => void;
}

/** Nothing here (yet): quiet icon, a sentence on what will appear, optional one action. */
export function EmptyState({ message, title, icon: Icon = Inbox, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-[32px] py-[48px]">
      <View className="max-w-[440px] items-center gap-[12px]">
        <View className="w-[48px] h-[48px] rounded-full border border-border items-center justify-center">
          <Icon size={22} color={kitColors.iconMuted} strokeWidth={1.75} />
        </View>
        {title ? <Text className="text-heading-lg text-text-primary text-center">{title}</Text> : null}
        <Text className="text-body-md text-text-tertiary text-center">{message}</Text>
        {actionLabel && onAction ? <View className="mt-[4px]"><Button label={actionLabel} onPress={onAction} /></View> : null}
      </View>
    </View>
  );
}
