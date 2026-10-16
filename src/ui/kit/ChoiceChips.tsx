import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { kitColors } from './colors';

type Option<K extends string> = K | { key: K; label: string };

/**
 * ChoiceChips — wrapping selectable chips for forms (single or multiple).
 * Selected = near-black with a check; others white with a hairline.
 */
export function ChoiceChips<K extends string>({ options, value, onChange, multiple }: {
  options: ReadonlyArray<Option<K>>;
  value: K | K[] | null;
  onChange: (next: any) => void;
  multiple?: boolean;
}) {
  const selected = new Set<K>(Array.isArray(value) ? value : value ? [value] : []);
  const toggle = (k: K) => {
    if (!multiple) return onChange(selected.has(k) ? null : k);
    const next = new Set(selected);
    next.has(k) ? next.delete(k) : next.add(k);
    onChange([...next]);
  };
  return (
    <View className="flex-row flex-wrap gap-[8px]">
      {options.map((o) => {
        const key = typeof o === 'string' ? o : o.key;
        const label = typeof o === 'string' ? o : o.label;
        const on = selected.has(key);
        return (
          <Pressable
            key={key}
            onPress={() => toggle(key)}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: on }}
            accessibilityLabel={label}
          >
            {({ pressed }) => (
              <View className={`flex-row items-center gap-[6px] min-h-[40px] px-[14px] rounded-full border ${on ? 'bg-accent border-accent' : pressed ? 'bg-bg-subtle border-border' : 'bg-bg-page border-border'}`}>
                {on ? <Check size={14} color={kitColors.inverse} strokeWidth={2.25} /> : null}
                <Text className={`text-body-sm font-medium ${on ? 'text-accent-text' : 'text-text-primary'}`}>{label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
