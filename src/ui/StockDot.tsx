import { View, Text } from 'react-native';

interface StockDotProps {
  status: 'in' | 'low' | 'out';
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  in: { dotColor: 'bg-success', label: 'In stock', a11yLabel: 'In stock' },
  low: { dotColor: 'bg-warning', label: 'Low stock', a11yLabel: 'Low stock' },
  out: { dotColor: 'bg-error', label: 'Out of stock', a11yLabel: 'Out of stock' },
} as const;

export function StockDot({ status, showLabel = false }: StockDotProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      className="flex-row items-center gap-xs"
      accessibilityLabel={config.a11yLabel}
      accessibilityRole="text"
    >
      <View className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      {(showLabel || status === 'out') && (
        <Text className="text-caption text-text-muted">
          {config.label}
        </Text>
      )}
    </View>
  );
}
