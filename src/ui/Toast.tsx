import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react-native';
import { useToastStore, type ToastMessage, type ToastType } from './useToastStore';

const TOAST_DURATION_DEFAULT = 4000;

const typeConfig: Record<ToastType, { bg: string; border: string; icon: typeof AlertCircle; iconColor: string; titleColor: string }> = {
  error: {
    bg: 'bg-[#FEF3F2]',
    border: 'border-[#FECDCA]',
    icon: AlertCircle,
    iconColor: '#B42318',
    titleColor: 'text-[#B42318]',
  },
  success: {
    bg: 'bg-[#ECFDF3]',
    border: 'border-[#ABEFC6]',
    icon: CheckCircle,
    iconColor: '#067647',
    titleColor: 'text-[#067647]',
  },
  warning: {
    bg: 'bg-[#FFFAEB]',
    border: 'border-[#FEDF89]',
    icon: AlertTriangle,
    iconColor: '#B54708',
    titleColor: 'text-[#B54708]',
  },
  info: {
    bg: 'bg-[#EFF4FF]',
    border: 'border-[#B2CCFF]',
    icon: Info,
    iconColor: '#023891',
    titleColor: 'text-[#023891]',
  },
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast: toastData, onDismiss }: ToastItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const duration = toastData.duration ?? TOAST_DURATION_DEFAULT;
  const config = typeConfig[toastData.type];
  const Icon = config.icon;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(toastData.id);
      });
    }, duration);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
      className={`flex-row items-start ${config.bg} ${config.border} border rounded-lg px-md py-sm mb-sm`}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View className="mt-[2px] mr-sm">
        <Icon size={20} color={config.iconColor} />
      </View>
      <View className="flex-1 mr-sm">
        <Text className={`${config.titleColor} text-body-md font-medium`}>
          {toastData.title}
        </Text>
        {toastData.message && (
          <Text className="text-text-secondary text-body-sm mt-xs">
            {toastData.message}
          </Text>
        )}
      </View>
      <Pressable
        onPress={() => onDismiss(toastData.id)}
        className="min-w-[44px] min-h-[44px] items-center justify-center -mr-sm -mt-sm"
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={8}
      >
        <X size={16} color={config.iconColor} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * ToastContainer — renders at the top of the screen, below the ModeStrip.
 * Place this in the root layout, inside the main View but after ModeStrip.
 * Uses absolute positioning so it doesn't shift layout.
 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute top-[26px] left-0 right-0 z-50 px-xl pt-md"
      pointerEvents="box-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </View>
  );
}
