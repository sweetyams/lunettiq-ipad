import { View, Text } from 'react-native';
import { elevation } from './elevation';

/**
 * StatRow — a row of key figures in one white panel, divided by hairlines
 * (Found UI StatCard). Values large and tabular, labels as quiet micro-labels.
 */
export function StatRow({ stats }: { stats: Array<{ label: string; value: string }> }) {
  return (
    <View className="flex-row bg-bg-surface border border-border rounded-lg" style={elevation.raised}>
      {stats.map((s, i) => (
        <View key={s.label} className={`flex-1 px-[20px] py-[16px] ${i > 0 ? 'border-l border-border' : ''}`}>
          <Text className="text-caption-sm uppercase text-text-tertiary">{s.label}</Text>
          <Text className="text-display-sm text-text-primary mt-[6px]" style={{ fontVariant: ['tabular-nums'] }} numberOfLines={1}>{s.value}</Text>
        </View>
      ))}
    </View>
  );
}
