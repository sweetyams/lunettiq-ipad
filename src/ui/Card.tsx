import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  editing?: boolean;
  className?: string;
}

interface CardHeadProps {
  children: React.ReactNode;
  editing?: boolean;
}

interface CardBodyProps {
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

interface CardFootProps {
  children: React.ReactNode;
}

function CardRoot({ children, editing = false, className = '' }: CardProps) {
  const editClasses = editing ? 'border-focus-ring' : 'border-border';

  return (
    <View className={`border rounded-md bg-bg-surface overflow-hidden ${editClasses} ${className}`}>
      {children}
    </View>
  );
}

function CardHead({ children, editing = false }: CardHeadProps) {
  return (
    <View className={`flex-row items-center justify-between gap-md px-md py-[12px] border-b border-border ${editing ? 'bg-bg-muted' : ''}`}>
      {children}
    </View>
  );
}

function CardBody({ children, noPadding = false, className = '' }: CardBodyProps) {
  return (
    <View className={`${noPadding ? '' : 'p-md'} ${className}`}>
      {children}
    </View>
  );
}

function CardFoot({ children }: CardFootProps) {
  return (
    <View className="flex-row items-center justify-end gap-sm px-md py-[12px] border-t border-border">
      {children}
    </View>
  );
}

// Export as a namespace object with explicit properties
// This avoids Object.assign issues with Metro/Hermes bundler
export const Card = CardRoot as typeof CardRoot & {
  Head: typeof CardHead;
  Body: typeof CardBody;
  Foot: typeof CardFoot;
};
Card.Head = CardHead;
Card.Body = CardBody;
Card.Foot = CardFoot;
