import { View, Pressable } from 'react-native';
import { Heart, ThumbsUp, HelpCircle, XCircle } from 'lucide-react-native';
import { Verdict } from '@/src/features/fitting/fitting.types';

interface VerdictControlProps {
  value: Verdict | null;
  onChange: (verdict: Verdict) => void;
}

const verdictConfig = {
  loved: { icon: Heart, color: '#005D23' },
  liked: { icon: ThumbsUp, color: '#2D4A8A' },
  unsure: { icon: HelpCircle, color: '#D4A017' },
  rejected: { icon: XCircle, color: '#6B6B6B' }
} as const;

export function VerdictControl({ value, onChange }: VerdictControlProps) {
  const verdictOptions: Verdict[] = ['loved', 'liked', 'unsure', 'rejected'];

  return (
    <View className="border border-border rounded-md flex-row overflow-hidden">
      {verdictOptions.map((verdict, index) => {
        const isActive = value === verdict;
        const isLast = index === verdictOptions.length - 1;
        const { icon: IconComponent, color } = verdictConfig[verdict];

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