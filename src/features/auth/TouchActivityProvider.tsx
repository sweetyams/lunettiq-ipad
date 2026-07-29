import React, { createContext, useContext, useCallback, useRef } from 'react';
import { View, GestureResponderEvent } from 'react-native';

/**
 * Context for reporting touch activity to the auto-lock system.
 * The resetActivity callback is provided by AuthProvider (from useAutoLock).
 */
interface TouchActivityContextType {
  reportActivity: () => void;
}

const TouchActivityContext = createContext<TouchActivityContextType>({
  reportActivity: () => {},
});

export function useTouchActivity(): TouchActivityContextType {
  return useContext(TouchActivityContext);
}

interface TouchActivityProviderProps {
  children: React.ReactNode;
  /** Callback to reset the auto-lock timer */
  onActivity: () => void;
}

/**
 * Wraps the app content and intercepts all touch start events.
 * On any touch, resets the auto-lock inactivity timer.
 *
 * Uses onStartShouldSetResponderCapture in capture phase so it sees
 * all touches without stealing them from child components.
 */
export function TouchActivityProvider({ children, onActivity }: TouchActivityProviderProps) {
  // Throttle: only report activity at most once per 10 seconds
  // to avoid resetting the timer on every single pixel of a scroll
  const lastReportRef = useRef(0);

  const handleTouchCapture = useCallback((_event: GestureResponderEvent): boolean => {
    const now = Date.now();
    if (now - lastReportRef.current > 10_000) {
      lastReportRef.current = now;
      onActivity();
    }
    // Return false — don't become the responder, just observe
    return false;
  }, [onActivity]);

  return (
    <TouchActivityContext.Provider value={{ reportActivity: onActivity }}>
      <View
        className="flex-1"
        onStartShouldSetResponderCapture={handleTouchCapture}
      >
        {children}
      </View>
    </TouchActivityContext.Provider>
  );
}
