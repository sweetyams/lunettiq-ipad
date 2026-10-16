import { ScrollView, Pressable, Text, View } from 'react-native';

/**
 * FilterChips — a row of selectable filters with optional counts (Builder
 * segmented style: selected = near-black, others = white with a hairline).
 */
export function FilterChips<K extends string>({ options, value, onChange }: {
  options: Array<{ key: K; label: string; count?: number }>;
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={typeof o.count === 'number' ? `${o.label}, ${o.count}` : o.label}
          >
            {({ pressed }) => (
              <View className={`flex-row items-center gap-[8px] px-[14px] min-h-[40px] rounded-full border ${on ? 'bg-accent border-accent' : `bg-bg-page border-border ${pressed ? 'bg-bg-subtle' : ''}`}`}>
                <Text className={`text-body-sm font-medium ${on ? 'text-accent-text' : 'text-text-primary'}`}>{o.label}</Text>
                {typeof o.count === 'number' ? (
                  <Text className={`text-body-sm ${on ? 'text-accent-text opacity-70' : 'text-text-tertiary'}`}>{o.count}</Text>
                ) : null}
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
