import { View, Text, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useSessionStore } from './useSessionStore';

export function SessionBanner() {
  const { mode, sessionStartedAt, reset } = useSessionStore();
  const [duration, setDuration] = useState<string>('0:00');

  const isSessionActive = mode === 'session' || mode === 'fitting';

  useEffect(() => {
    if (!isSessionActive || !sessionStartedAt) {
      setDuration('0:00');
      return;
    }

    const updateDuration = () => {
      const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    // Update immediately
    updateDuration();

    // Update every second
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartedAt]);

  if (!isSessionActive) return null;

  return (
    <View className="bg-brand rounded-lg p-sm flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="w-2 h-2 bg-accent rounded-full mr-sm" />
        <View className="flex-1">
          <Text className="text-text-inverse text-bodyStrong">Session active</Text>
          <Text className="text-text-inverse text-caption opacity-80">{duration}</Text>
        </View>
      </View>
      
      <Pressable
        onPress={reset}
        className="bg-bg-elevated bg-opacity-20 rounded-md px-md py-sm min-h-[44px] items-center justify-center"
      >
        <Text className="text-text-inverse text-bodyStrong">End session</Text>
      </Pressable>
    </View>
  );
}