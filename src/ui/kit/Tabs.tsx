import { View, Text, Pressable } from 'react-native';

/**
 * Tabs — Builder underline tabs: quiet labels, the active one near-black with
 * a 2px near-black rule. Never brand blue.
 */
export function Tabs<K extends string>({ value, onChange, options }: {
  value: K;
  onChange: (key: K) => void;
  options: Array<{ key: K; label: string; count?: number }>;
}) {
  return (
    <View className="flex-row gap-[28px] px-[32px] border-b border-border bg-bg-page" accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={8}
            className="min-h-[52px] justify-center"
          >
            <Text className={`text-body-md ${active ? 'font-medium text-text-primary' : 'text-text-tertiary'}`}>
              {o.label}
              {typeof o.count === 'number' ? <Text className="text-text-dim">{`  ${o.count}`}</Text> : null}
            </Text>
            {active ? <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
