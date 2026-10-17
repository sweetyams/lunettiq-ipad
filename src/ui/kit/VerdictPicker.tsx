import { View, Text, Pressable } from 'react-native';
import { Heart, HelpCircle, X } from 'lucide-react-native';
import { kitColors } from './colors';

export type PickedVerdict = 'loved' | 'unsure' | 'rejected';

const CHOICES: Array<{ key: PickedVerdict; label: string; Icon: typeof Heart }> = [
  { key: 'loved', label: 'Love', Icon: Heart },
  { key: 'unsure', label: 'Maybe', Icon: HelpCircle },
  { key: 'rejected', label: 'No', Icon: X },
];

/**
 * VerdictPicker — the client's reaction to a frame: Love / Maybe / No.
 * One tap sets it; tapping the active choice clears it. Selected = near-black
 * (staff) or larger touch targets (`size="lg"`, client-facing). "liked" from
 * older data reads as Love.
 */
export function VerdictPicker({ value, onChange, size = 'md', label }: {
  value: string | null | undefined;
  onChange: (v: PickedVerdict | undefined) => void;
  size?: 'md' | 'lg';
  /** Frame name, for accessibility. */
  label: string;
}) {
  const current = value === 'liked' ? 'loved' : value;
  const lg = size === 'lg';
  return (
    <View className="flex-row gap-[6px]" accessibilityRole="radiogroup" accessibilityLabel={`Reaction to ${label}`}>
      {CHOICES.map(({ key, label: text, Icon }) => {
        const on = current === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(on ? undefined : key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={text}
            hitSlop={4}
          >
            {({ pressed }) => (
              <View className={`flex-row items-center justify-center gap-[6px] rounded-full border ${lg ? 'min-h-[56px] px-[22px]' : 'min-h-[40px] px-[12px]'} ${on ? 'bg-accent border-accent' : pressed ? 'bg-bg-subtle border-border' : 'bg-bg-page border-border'}`}>
                <Icon size={lg ? 20 : 16} color={on ? kitColors.inverse : kitColors.icon} fill={on && key === 'loved' ? kitColors.inverse : 'none'} />
                <Text className={`${lg ? 'text-body-lg' : 'text-body-sm'} font-medium ${on ? 'text-accent-text' : 'text-text-primary'}`}>{text}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
