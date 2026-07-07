import { Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

export function PrivacyToggle() {
  const { mode, toggleMode } = usePrivacyStore();

  const isStaffMode = mode === 'staff';

  return (
    <Pressable
      onPress={toggleMode}
      className={`
        w-[44px] h-[44px] items-center justify-center rounded-md
        ${isStaffMode 
          ? 'bg-white border border-warmGrey' 
          : 'bg-green'
        }
      `}
      accessibilityLabel={`Toggle privacy mode. Currently ${mode} mode`}
      accessibilityRole="button"
    >
      {isStaffMode ? (
        <Eye size={20} color="#0A153D" />
      ) : (
        <EyeOff size={20} color="#FFFFFF" />
      )}
    </Pressable>
  );
}