import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Delete } from 'lucide-react-native';

/**
 * Color schemes for PinPad surface variants.
 * 
 * 'light' — used on bg-page / bg-surface (default app surfaces)
 * 'dark'  — used on bg-inverse / chrome (lock screen, dark panels)
 *
 * Values sourced from tailwind.config.js tokens:
 *   Light: text-primary=#1D1F21, border=rgba(17,17,17,0.18), bg-surface=#F8F6F7
 *   Dark:  text-inverse=#FFFFFF, border-inverse=rgba(255,255,255,0.18), bg-inverse=#111111
 */
const SCHEME = {
  light: {
    text: '#1D1F21',
    textMuted: 'rgba(29,31,33,0.45)',
    border: 'rgba(17,17,17,0.18)',
    buttonBg: '#F8F6F7',
    dotFilled: '#1D1F21',     // brand
    dotEmpty: '#F8F6F7',      // bg-surface
    dotBorder: 'rgba(17,17,17,0.18)',
    error: '#B42318',
    warning: '#B54708',
  },
  dark: {
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.5)',
    border: 'rgba(255,255,255,0.18)',
    buttonBg: 'rgba(255,255,255,0.06)',
    dotFilled: '#FFFFFF',     // text-inverse
    dotEmpty: 'transparent',
    dotBorder: 'rgba(255,255,255,0.4)',
    error: '#F87171',         // lighter red for dark bg
    warning: '#FBBF24',       // lighter amber for dark bg
  },
} as const;

interface PinPadProps {
  onComplete: (pin: string) => void;
  error?: string | null;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  remainingAttempts?: number;
  lockedUntil?: string | null;
  /** Surface variant — determines color scheme. Default: 'light' */
  variant?: 'light' | 'dark';
}

export function PinPad({
  onComplete,
  error,
  disabled = false,
  title = 'Enter your PIN',
  subtitle,
  remainingAttempts,
  lockedUntil,
  variant = 'light',
}: PinPadProps) {
  const [pin, setPin] = useState('');
  const [countdown, setCountdown] = useState<string | null>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const colors = SCHEME[variant];

  // Countdown timer when locked
  useEffect(() => {
    if (!lockedUntil) {
      setCountdown(null);
      return;
    }

    const lockEndTime = new Date(lockedUntil).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = lockEndTime - now;

      if (remaining <= 0) {
        setCountdown(null);
        return;
      }

      const seconds = Math.ceil(remaining / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      if (minutes > 0) {
        setCountdown(`${minutes}:${remainingSeconds.toString().padStart(2, '0')}`);
      } else {
        setCountdown(`${remainingSeconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      const shakeSequence = Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: -10, duration: 75, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 75, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 75, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 75, useNativeDriver: true }),
      ]);

      shakeSequence.start();

      const timeout = setTimeout(() => {
        setPin('');
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [error, shakeAnimation]);

  const isLocked = !!(lockedUntil && new Date(lockedUntil) > new Date());
  const isDisabled = disabled || isLocked;

  const handleDigit = (digit: string) => {
    if (isDisabled || pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      onComplete(newPin);
    }
  };

  const handleBackspace = () => {
    if (isDisabled) return;
    setPin(pin.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      )}

      {/* PIN dots */}
      <Animated.View
        style={[styles.dotsRow, { transform: [{ translateX: shakeAnimation }] }]}
        accessibilityRole="text"
        accessibilityLabel={`PIN entry, ${pin.length} of 4 digits entered`}
      >
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < pin.length ? colors.dotFilled : colors.dotEmpty,
                borderColor: i < pin.length ? colors.dotFilled : colors.dotBorder,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Error message */}
      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}

      {/* Lockout countdown */}
      {countdown ? (
        <Text style={[styles.errorText, { color: colors.warning }]}>
          {'Locked for ' + countdown}
        </Text>
      ) : null}

      {/* Remaining attempts */}
      {remainingAttempts !== undefined && remainingAttempts > 0 && !isLocked ? (
        <Text style={[styles.attemptsText, { color: colors.textMuted }]}>
          {remainingAttempts + ' attempt' + (remainingAttempts === 1 ? '' : 's') + ' remaining'}
        </Text>
      ) : null}

      {/* Numpad */}
      <View style={styles.numpad}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['⌫', '0', '']].map((row, rowIdx) => (
          <View key={rowIdx} style={styles.numpadRow}>
            {row.map((key) => {
              if (key === '') {
                return <View key="empty" style={styles.button} />;
              }

              const isBackspace = key === '⌫';
              const onPress = isBackspace ? handleBackspace : () => handleDigit(key);

              return (
                <Pressable
                  key={key}
                  onPress={onPress}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={isBackspace ? 'Delete last digit' : `Digit ${key}`}
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.buttonBg,
                      borderColor: colors.border,
                      opacity: isDisabled ? 0.4 : 1,
                    },
                  ]}
                >
                  {isBackspace ? (
                    <Delete size={24} color={isDisabled ? colors.textMuted : colors.text} />
                  ) : (
                    <Text style={[styles.buttonText, { color: isDisabled ? colors.textMuted : colors.text }]}>
                      {key}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginTop: -16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  attemptsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  numpad: {
    gap: 16,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '400',
  },
});
