import { View } from 'react-native';

// ─── Card Sub-Components ──────────────────────────────────────
// Exported individually to avoid compound-component bundling issues with Hermes.
// Usage: import { Card, CardHead, CardBody, CardFoot } from '@/src/ui/Card';
// Or via barrel: import { Card, CardHead, CardBody, CardFoot } from '@/src/ui';

interface CardProps {
  children: React.ReactNode;
  editing?: boolean;
  className?: string;
}

export function Card({ children, editing = false, className = '' }: CardProps) {
  const editClasses = editing ? 'border-focus-ring' : 'border-border';
  return (
    <View className={`border rounded-md bg-bg-surface overflow-hidden ${editClasses} ${className}`}>
      {children}
    </View>
  );
}

interface CardHeadProps {
  children: React.ReactNode;
  editing?: boolean;
}

export function CardHead({ children, editing = false }: CardHeadProps) {
  return (
    <View className={`flex-row items-center justify-between gap-md px-md py-[12px] border-b border-border ${editing ? 'bg-bg-muted' : ''}`}>
      {children}
    </View>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function CardBody({ children, noPadding = false, className = '' }: CardBodyProps) {
  return (
    <View className={`${noPadding ? '' : 'p-md'} ${className}`}>
      {children}
    </View>
  );
}

interface CardFootProps {
  children: React.ReactNode;
}

export function CardFoot({ children }: CardFootProps) {
  return (
    <View className="flex-row items-center justify-end gap-sm px-md py-[12px] border-t border-border">
      {children}
    </View>
  );
}
