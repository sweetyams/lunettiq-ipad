import { View, Text } from 'react-native';
import { Check, Minus } from 'lucide-react-native';

interface FitBadgeProps {
  score: number | null;
  reasons?: string[];
}

export function FitBadge({ score, reasons }: FitBadgeProps) {
  if (score === null || score < 3) return null;

  const isGoodFit = score >= 5;
  const label = isGoodFit ? 'Good fit' : 'Close match';
  const colorClass = isGoodFit ? 'text-success' : 'text-warning';
  const iconColor = isGoodFit ? '#16A34A' : '#CA8A04';

  return (
    <View
      className="flex-row items-center gap-xs"
      accessibilityLabel={`${label}${reasons?.length ? ': ' + reasons[0] : ''}`}
      accessibilityRole="text"
    >
      {isGoodFit ? (
        <Check size={12} color={iconColor} strokeWidth={3} />
      ) : (
        <Minus size={12} color={iconColor} strokeWidth={3} />
      )}
      <Text className={`text-caption font-medium ${colorClass}`}>
        {label}
      </Text>
    </View>
  );
}
