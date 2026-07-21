import { View, Pressable } from 'react-native';
import { Heart, ThumbsUp, HelpCircle, XCircle } from 'lucide-react-native';
import { Verdict } from '@/src/features/fitting/fitting.types';
import { useDesignTokens } from '@/src/features/design';

interface VerdictControlProps {
  value: Verdict | null;
  onChange: (verdict: Verdict) => void;
}

const verdictConfig = {
  loved: { icon: Heart },
  liked: { icon: ThumbsUp },
  unsure: { icon: HelpCircle },
  rejected: { icon: XCircle }
} as const;

export function VerdictControl({ value, onChange }: VerdictControlProps) {
  const { colors, semantic } = useDesignTokens();
  const verdictOptions: Verdict[] = ['loved', 'liked', 'unsure', 'rejected'];

  const getVerdictColor = (verdictKey: Verdict): string => {
    switch (verdictKey) {
      case 'loved': return semantic.verdictLoved;
      case 'liked': return semantic.verdictLiked;
      case 'unsure': return semantic.verdictUnsure;
      case 'rejected': return semantic.verdictRejected;
      default: return colors.textMuted;
    }
  };

  return (
    <View className="border border-border rounded-md flex-row overflow-hidden">
      {verdictOptions.map((verdict, index) => {
        const isActive = value === verdict;
        const isLast = index === verdictOptions.length - 1;
        const { icon: IconComponent } = verdictConfig[verdict];
        const color = getVerdictColor(verdict);

        return (
          <Pressable
            key={verdict}
            onPress={() => onChange(verdict)}
            className={`
              w-[52px] h-[40px] items-center justify-center
              ${isActive ? '' : 'bg-bg-elevated'}
              ${!isLast ? 'border-r border-border' : ''}
            `}
            style={isActive ? { backgroundColor: color } : undefined}
            accessibilityRole="button"
            accessibilityLabel={`${verdict} verdict`}
            accessibilityState={{ selected: isActive }}
          >
            <IconComponent
              size={20}
              color={isActive ? '#FFFFFF' : '#6B6B6B'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}