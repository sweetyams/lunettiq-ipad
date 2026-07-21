import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  // Foundry-style border-based depth, no shadows
  const baseClasses = 'bg-bg-elevated rounded-lg border border-border p-md';
  
  return (
    <View className={`${baseClasses} ${className}`}>
      {children}
    </View>
  );
}