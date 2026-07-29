import { View, Text } from 'react-native';
import { Chip } from './Chip';

interface ProfileGap {
  id: string;
  label: string;
}

interface ProfileGapChipsProps {
  gaps: ProfileGap[];
  onGapPress: (gapId: string) => void;
}

export function ProfileGapChips({ gaps, onGapPress }: ProfileGapChipsProps) {
  if (gaps.length === 0) return null;

  return (
    <View>
      <Text className="text-caption-md tracking-widest uppercase text-text-muted mb-sm">
        Profile gaps — tap to fill
      </Text>
      <View className="flex-row flex-wrap gap-sm">
        {gaps.map((gap) => (
          <Chip
            key={gap.id}
            label={gap.label}
            variant="add"
            onPress={() => onGapPress(gap.id)}
          />
        ))}
      </View>
    </View>
  );
}