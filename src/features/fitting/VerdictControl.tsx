import { View, Text, Pressable } from 'react-native';
import { Heart, ThumbsUp, HelpCircle, XCircle, User } from 'lucide-react-native';
import type { Verdict } from './fitting.types';
import { useDesignTokens } from '@/src/features/design';

interface VerdictControlProps {
  value: Verdict | null;
  onChange: (verdict: Verdict) => void;
  size?: 'small' | 'medium' | 'large';
  clientVoice?: boolean; // Shows person icon when client set the verdict
}

const verdictOptions = [
  { key: 'loved' as const, label: 'Loved', icon: Heart },
  { key: 'liked' as const, label: 'Liked', icon: ThumbsUp },  
  { key: 'unsure' as const, label: 'Unsure', icon: HelpCircle },
  { key: 'rejected' as const, label: 'No', icon: XCircle },
];

export function VerdictControl({ value, onChange, size = 'medium', clientVoice = false }: VerdictControlProps) {
  const { colors, semantic } = useDesignTokens();
  
  const sizeClasses = {
    small: 'px-sm py-xs',
    medium: 'px-md py-sm',
    large: 'px-lg py-md',
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18,
  };

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
    <View className="flex-row bg-bg-elevated rounded-lg p-xs border border-border">
      {verdictOptions.map((option) => {
        const isSelected = value === option.key;
        const Icon = option.icon;
        const verdictColor = getVerdictColor(option.key);
        
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`
              flex-1 items-center justify-center rounded-md min-h-[44px]
              ${sizeClasses[size]}
              ${isSelected ? 'bg-opacity-10' : 'bg-transparent'}
            `}
            style={isSelected ? { backgroundColor: `${verdictColor}20` } : undefined}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <View className="relative">
              <Icon 
                size={iconSizes[size]} 
                color={isSelected ? verdictColor : colors.textMuted} 
                strokeWidth={isSelected ? 2.5 : 2}
              />
              {/* Person icon when client set the verdict */}
              {isSelected && clientVoice && (
                <View className="absolute -top-1 -right-1 bg-accent rounded-full p-1">
                  <User size={8} color="white" strokeWidth={2} />
                </View>
              )}
            </View>
            <Text 
              className={`text-captionStrong mt-xs ${
                isSelected ? 'text-text-primary' : 'text-text-muted'
              }`}
              style={isSelected ? { color: verdictColor } : undefined}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}