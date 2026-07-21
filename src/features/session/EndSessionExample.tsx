/**
 * End Session Flow Usage Example
 * 
 * This demonstrates how to integrate the EndSessionFlow components
 * into your session screens.
 */

import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { EndSessionSheet } from '@/src/features/session';

export function SessionWorkspaceExample() {
  const [showEndSession, setShowEndSession] = useState(false);

  const handleEndSession = () => {
    setShowEndSession(true);
  };

  const handleEndSessionComplete = () => {
    setShowEndSession(false);
    // Navigate back to home or wherever appropriate
    console.log('Session ended successfully');
  };

  const handleEndSessionCancel = () => {
    setShowEndSession(false);
  };

  return (
    <View className="flex-1">
      {/* Your session content here */}
      
      {/* End Session Button */}
      <Pressable
        onPress={handleEndSession}
        className="bg-brand rounded-md py-md px-lg items-center"
      >
        <Text className="text-text-inverse text-body font-medium">End Session</Text>
      </Pressable>

      {/* End Session Sheet */}
      <EndSessionSheet
        visible={showEndSession}
        onDismiss={handleEndSessionCancel}
        onComplete={handleEndSessionComplete}
      />
    </View>
  );
}

/**
 * Component Features:
 * 
 * EndSessionFlow:
 * - 3-step process: Outcome → Summary → Notes
 * - Step indicator with dots
 * - Back navigation between steps
 * - Outcome selection with large touch targets (44pt minimum)
 * - Email summary toggle with language selection
 * - Internal notes with quick-tag chips
 * - Integration with session store and API
 * 
 * EndSessionSheet:
 * - Modal overlay presentation
 * - Backdrop dismiss support
 * - Centered card layout
 * - Responsive sizing (max-w-600px, max-h-80%)
 * 
 * State Management:
 * - Uses useSessionStore for session data
 * - Calls reset() on completion
 * - Creates interaction timeline entry via useCreateInteraction
 * 
 * Accessibility:
 * - 44pt minimum touch targets
 * - Proper accessibility labels and roles
 * - VoiceOver support
 * - Step navigation via back buttons
 */