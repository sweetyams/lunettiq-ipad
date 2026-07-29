import { View, Text } from 'react-native';

interface Stat {
  value: string;
  label: string;
}

interface StatCardProps {
  stats: [Stat, Stat, Stat];
}

export function StatCard({ stats }: StatCardProps) {
  return (
    <View className="border border-border rounded-md bg-bg-surface">
      <View className="flex-row py-lg">
        {stats.map((stat, i) => (
          <View
            key={stat.label}
            className={`flex-1 items-center ${
              i > 0 ? 'border-l border-border' : ''
            }`}
          >
            <Text className="text-heading-lg font-mono text-text-primary">
              {stat.value}
            </Text>
            <Text className="text-caption-md tracking-widest uppercase text-text-muted mt-xs">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}