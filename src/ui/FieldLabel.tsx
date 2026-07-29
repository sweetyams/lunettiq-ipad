import { Text } from 'react-native';

interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
}

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return (
    <Text className="text-caption-md tracking-widest uppercase text-text-muted mb-sm">
      {children}{required ? ' *' : ''}
    </Text>
  );
}