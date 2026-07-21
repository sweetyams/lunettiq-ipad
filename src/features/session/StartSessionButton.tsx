import { Pressable, Text } from 'react-native';
import { useSessionStore } from './useSessionStore';

interface StartSessionButtonProps {
  clientId: string;
  clientName: string;
}

export function StartSessionButton({ clientId, clientName }: StartSessionButtonProps) {
  const { activeClientId, mode, setClient } = useSessionStore();
  
  const isSessionActive = mode === 'session' || mode === 'fitting';
  const isThisClientSession = activeClientId === clientId;
  const isOtherClientSession = isSessionActive && !isThisClientSession;

  const handlePress = () => {
    if (!isSessionActive) {
      setClient(clientId);
    }
  };

  const getButtonText = () => {
    if (isThisClientSession) return 'Session active';
    if (isOtherClientSession) return 'End other session first';
    return `Start session with ${clientName}`;
  };

  const isDisabled = isSessionActive;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className={`
        ${isDisabled ? 'bg-text-muted' : 'bg-accent'} 
        rounded-md min-h-[44px] px-lg py-sm items-center justify-center
      `}
    >
      <Text className="text-text-inverse text-bodyStrong">
        {getButtonText()}
      </Text>
    </Pressable>
  );
}