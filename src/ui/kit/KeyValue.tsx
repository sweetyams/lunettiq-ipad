import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

/**
 * KeyValue — inspector-style label/value rows with hairline dividers (Found UI
 * inspector fields). Missing values read as a quiet "Not set", never italics.
 */
export function KeyValue({ rows, mono }: {
  rows: Array<{ label: string; value: ReactNode | null | undefined }>;
  /** Tabular figures for numbers and dates. */
  mono?: boolean;
}) {
  return (
    <View>
      {rows.map((r, i) => {
        const empty = r.value == null || r.value === '';
        return (
          <View key={r.label} className={`flex-row items-center justify-between gap-[16px] min-h-[44px] py-[8px] ${i > 0 ? 'border-t border-border' : ''}`}>
            <Text className="text-body-sm text-text-tertiary">{r.label}</Text>
            {typeof r.value === 'string' || typeof r.value === 'number' || empty ? (
              <Text
                className={`text-body-md flex-shrink text-right ${empty ? 'text-text-dim' : 'text-text-primary'}`}
                style={mono ? { fontVariant: ['tabular-nums'] } : undefined}
                numberOfLines={1}
              >
                {empty ? 'Not set' : r.value}
              </Text>
            ) : r.value}
          </View>
        );
      })}
    </View>
  );
}
