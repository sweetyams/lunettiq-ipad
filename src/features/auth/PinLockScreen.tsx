import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import { PinPad } from '@/src/ui/PinPad';
import { useOperatorStore, Operator } from './useOperatorStore';
import { useAuthenticate, AuthenticateResponse } from '@/src/api/useDeviceAuth';
import { useBiometric } from './useBiometric';
import { APIError } from '@/src/api/client';
import { Wordmark } from '@/src/ui/Wordmark';
import { useUser } from '@clerk/clerk-expo';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';

import { isNotMemberError } from './authErrors';

// Lock screen colors — hardcoded for reliability (renders before token provider)
const C = {
  bg: '#111111',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.5)',
  textSubtle: 'rgba(255,255,255,0.3)',
  brand: '#023891',
  error: '#F87171',
  border: 'rgba(255,255,255,0.12)',
} as const;

interface PinLockScreenProps {
  onUnlock: () => void;
  isAuthReady?: boolean;
  /** Escape hatch — fully sign out of Clerk. */
  onSignOut?: () => void;
  /** Escape hatch — leave this store and re-select (only when >1 store). */
  onChangeStore?: () => void;
}

/**
 * PIN-as-identity lock screen.
 *
 * Shows a PIN pad immediately — no roster, no profile selection.
 * The server resolves who you are from the PIN alone.
 * Device owner can bypass via Face ID.
 */
export function PinLockScreen({ onUnlock, isAuthReady = true, onSignOut, onChangeStore }: PinLockScreenProps) {
  const { switchOperator, clearOperator } = useOperatorStore();
  const { authenticate: authenticateBiometric } = useBiometric();
  const { mutate: authenticate, isPending } = useAuthenticate();

  const [pinError, setPinError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | undefined>(undefined);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notMember, setNotMember] = useState(false);
  const { user } = useUser();
  const storeName = useTenantStore((s) => s.activeProject?.name ?? null);
  const accountEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  const handlePinComplete = useCallback((pin: string) => {
    setPinError(null);
    setNotMember(false);

    authenticate(
      { pin },
      {
        onSuccess: (response: AuthenticateResponse) => {
          const operator: Operator = {
            staffId: response.staffId,
            clerkUserId: response.clerkUserId,
            name: response.name,
            email: response.email,
            role: response.role,
            imageUrl: response.imageUrl,
          };
          switchOperator(operator);
          onUnlock();
        },
        onError: (error) => {
          if (error instanceof APIError) {
            // Prefer HTTP status (handoff §4: 401 = wrong PIN, 423 = locked), then
            // fall back to the body error code (INVALID_PIN / LOCKED).
            const isLocked = error.status === 423 || error.code === 'LOCKED';
            const isWrongPin = error.status === 401 || error.code === 'INVALID_PIN';

            if (isLocked) {
              setPinError('Too many attempts');
              if (error.details && typeof error.details === 'object' && 'lockedUntil' in error.details) {
                setLockedUntil((error.details as { lockedUntil: string }).lockedUntil);
              }
            } else if (isWrongPin) {
              setPinError('Incorrect PIN');
              if (error.details && typeof error.details === 'object' && 'remainingAttempts' in error.details) {
                setRemainingAttempts((error.details as { remainingAttempts: number }).remainingAttempts);
              }
            } else if (isNotMemberError(error)) {
              // The PIN may be fine: the account signed in on this iPad isn't on this store.
              setNotMember(true);
              setPinError('This iPad’s account can’t open this store');
            } else {
              setPinError(error.message);
            }
          } else {
            setPinError('Authentication failed');
          }
        },
      }
    );
  }, [authenticate, switchOperator, onUnlock]);

  const handleDeviceOwnerUnlock = useCallback(async () => {
    const success = await authenticateBiometric('Unlock Lunettiq');
    if (success) {
      clearOperator();
      onUnlock();
    }
  }, [authenticateBiometric, clearOperator, onUnlock]);

  return (
    <View style={styles.overlay}>
      <View style={styles.screen}>
        {/* Branding — shared with the splash and sign-in */}
        <View style={styles.branding}>
          <Wordmark tone="inverse" size="md" />
        </View>

        {/* PIN pad — centered */}
        <View style={styles.pinContent}>
          <PinPad
            title="Enter your PIN"
            variant="dark"
            onComplete={handlePinComplete}
            error={pinError}
            disabled={isPending}
            remainingAttempts={remainingAttempts}
            lockedUntil={lockedUntil}
          />
        </View>

        {notMember ? (
          <Text style={styles.helpText} accessibilityLiveRegion="polite">
            {accountEmail ? `Signed in as ${accountEmail}` : 'The signed-in account'}
            {storeName ? ` isn’t a member of ${storeName}.` : ' isn’t a member of this store.'}
            {' Ask an owner to add it in Foundry (Team), or sign out and sign in with a store account.'}
          </Text>
        ) : null}

        {/* Which account and store this iPad runs as — so staff can tell what's wrong */}
        {(accountEmail || storeName) && !notMember ? (
          <Text style={styles.contextText}>{[storeName, accountEmail].filter(Boolean).join(' · ')}</Text>
        ) : null}

        {/* Device owner unlock — escape hatch at bottom */}
        <Pressable
          onPress={handleDeviceOwnerUnlock}
          accessibilityRole="button"
          accessibilityLabel="Unlock as device owner with Face ID"
          style={styles.deviceOwnerButton}
        >
          <Fingerprint size={18} color={C.textMuted} />
          <Text style={styles.deviceOwnerText}>Device owner</Text>
        </Pressable>

        {/* Escape hatches — never let the user get trapped behind a PIN */}
        {(onChangeStore || onSignOut) && (
          <View style={styles.escapeRow}>
            {onChangeStore && (
              <Pressable
                onPress={onChangeStore}
                accessibilityRole="button"
                accessibilityLabel="Change store"
                style={styles.escapeButton}
              >
                <Text style={styles.escapeText}>Change store</Text>
              </Pressable>
            )}
            {onChangeStore && onSignOut && <Text style={styles.escapeDivider}>·</Text>}
            {onSignOut && (
              <Pressable
                onPress={onSignOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                style={styles.escapeButton}
              >
                <Text style={styles.escapeText}>Sign out</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bg,
    zIndex: 999,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  branding: {
    marginBottom: 48,
    opacity: 0.7,
  },
  pinContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceOwnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    minHeight: 44,
    minWidth: 44,
  },
  deviceOwnerText: {
    fontSize: 14,
    color: C.textMuted,
  },
  escapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  escapeButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  escapeText: {
    fontSize: 14,
    color: C.textSubtle,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    color: C.text,
    textAlign: 'center',
    maxWidth: 420,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  contextText: {
    fontSize: 14,
    color: C.textSubtle,
    textAlign: 'center',
    marginBottom: 4,
  },
  escapeDivider: {
    fontSize: 14,
    color: C.textSubtle,
  },
});
