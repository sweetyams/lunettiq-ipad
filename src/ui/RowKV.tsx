import { View, Text } from 'react-native';

interface RowKVProps {
  label: string;
  value?: string | React.ReactNode;
  mono?: boolean;
  isLast?: boolean;
}

export function RowKV({ label, value, mono = false, isLast = false }: RowKVProps) {
  const valueContent = !value || value === '—' ? (
    <Text className="text-body-sm text-text-muted">—</Text>
  ) : typeof value === 'string' ? (
    <Text className={`text-body-sm text-text-primary text-right ${mono ? 'font-mono' : ''}`}>
      {value}
    </Text>
  ) : value;

  return (
    <View className={`flex-row items-baseline justify-between gap-md py-[9px] ${!isLast ? 'border-b border-bg-muted' : ''}`}>
      <Text className="text-body-sm text-text-muted">{label}</Text>
      {valueContent}
    </View>
  );
}