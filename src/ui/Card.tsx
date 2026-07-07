import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  const baseClasses = 'bg-white rounded-lg p-md shadow-sm';
  
  return (
    <View className={`${baseClasses} ${className}`}>
      {children}
    </View>
  );
}