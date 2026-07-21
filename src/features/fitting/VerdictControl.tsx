import { View, Text, Pressable } from 'react-native';
import { Heart, ThumbsUp, HelpCircle, XCircle, User } from 'lucide-react-native';
import type { Verdict } from './fitting.types';

interface VerdictControlProps {
  value: Verdict | null;
  onChange: (verdict: Verdict) => void;
  size?: 'small' | 'medium' | 'large';
  clientVoice?: boolean; // Shows person icon when client set the verdict
}

const verdictOptions = [
  { key: 'loved' as const, label: 'Loved', color: '#005D23', icon: Heart },
  { key: 'liked' as const, label: 'Liked', color: '#2D4A8A', icon: ThumbsUp },
  { key: 'unsure' as const, label: 'Unsure', color: '#D4A017', icon: HelpCircle },
  { key: 'rejected' as const, label: 'No', color: '#6B6B6B', icon: XCircle },
];

export function VerdictControl({ value, onChange, size = 'medium', clientVoice = false }: VerdictControlProps) {
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

  return (
    <View className="flex-row bg-bg-elevated rounded-lg p-xs border border-border">
      {verdictOptions.map((option) => {
        const isSelected = value === option.key;
        const Icon = option.icon;
        
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            className={`
              flex-1 items-center justify-center rounded-md min-h-[44px]
              ${sizeClasses[size]}
              ${isSelected ? 'bg-opacity-10' : 'bg-transparent'}
            `}
            style={isSelected ? { backgroundColor: `${option.color}20` } : undefined}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`Rate as ${option.label}`}
          >
            <View className="relative">
              <Icon 
                size={iconSizes[size]} 
                color={isSelected ? option.color : '#6B6B6B'} 
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
              style={isSelected ? { color: option.color } : undefined}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}