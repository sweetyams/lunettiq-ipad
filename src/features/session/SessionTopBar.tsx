import { View, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Play } from 'lucide-react-native';
import { useSessionStore } from './useSessionStore';
import { SyncIndicator } from '@/src/ui/SyncIndicator';
import { PrivacyToggle } from '@/src/ui/PrivacyToggle';

interface SessionTopBarProps {
  onBack: () => void;
  onStartFitting: () => void;
  onEndSession: () => void;
}

export function SessionTopBar({ onBack, onStartFitting, onEndSession }: SessionTopBarProps) {
  const { activeClientName, mode, sessionStartedAt } = useSessionStore();
  const [duration, setDuration] = useState('0:00');

  useEffect(() => {
    if (!sessionStartedAt) {
      setDuration('0:00');
      return;
    }

    const updateDuration = () => {
      const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  const isFitting = mode === 'fitting';

  return (
    <View className="flex-row h-[60px] items-center px-lg bg-bg-elevated border-b border-border">
      {/* Left: Back + Session chip */}
      <View className="flex-row items-center flex-1">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to client profile"
          className="min-w-[44px] min-h-[44px] items-center justify-center mr-sm"
        >
          <ArrowLeft color="#0A153D" size={22} />
        </Pressable>

        {/* Session chip */}
        <View className="flex-row items-center px-md py-sm rounded-full bg-brand">
          <View className="w-2 h-2 rounded-full bg-accent mr-sm" />
          <Clock color="#FFFFFF" size={14} />
          <Text className="text-text-inverse text-body font-medium ml-xs" numberOfLines={1}>
            Session · {activeClientName ?? 'Client'} · {duration}
          </Text>
        </View>
      </View>

      {/* Right: Actions + Chrome */}
      <View className="flex-row items-center gap-sm">
        <SyncIndicator />
        <PrivacyToggle />

        {/* End session — secondary */}
        <Pressable
          onPress={onEndSession}
          accessibilityRole="button"
          accessibilityLabel="End session"
          className="min-h-[44px] px-lg py-sm border border-border rounded-md items-center justify-center"
        >
          <Text className="text-text-primary text-bodyStrong">End session</Text>
        </Pressable>

        {/* Start fitting — primary action (green, one per screen) */}
        {!isFitting && (
          <Pressable
            onPress={onStartFitting}
            accessibilityRole="button"
            accessibilityLabel="Start fitting"
            className="min-h-[44px] px-lg py-sm bg-accent rounded-md flex-row items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <Play color="#FFFFFF" size={16} />
            <Text className="text-text-inverse text-bodyStrong ml-xs">Start fitting</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
