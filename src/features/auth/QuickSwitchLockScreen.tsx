import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Fingerprint, ChevronLeft } from 'lucide-react-native';
import { PinPad } from '@/src/ui/PinPad';
import { useOperatorStore, Operator } from './useOperatorStore';
import { useStaffRoster, useVerifyPin, StaffRosterEntry } from '@/src/api/useDeviceAuth';
import { useStaffProfile } from './useStaffProfile';
import { useBiometric } from './useBiometric';
import { APIError } from '@/src/api/client';

// Lock screen colors — hardcoded for reliability (renders before token provider)
const C = {
  bg: '#111111',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.5)',
  textSubtle: 'rgba(255,255,255,0.3)',
  brand: '#023891',
  error: '#F87171',
  border: 'rgba(255,255,255,0.12)',
  buttonBg: 'rgba(255,255,255,0.05)',
  divider: 'rgba(255,255,255,0.08)',
} as const;

interface QuickSwitchLockScreenProps {
  onUnlock: () => void;
  isAuthReady?: boolean;
}

export function QuickSwitchLockScreen({ onUnlock, isAuthReady = true }: QuickSwitchLockScreenProps) {
  const { locationId } = useStaffProfile();
  const { deviceOwnerId, setRoster, switchOperator, clearOperator } = useOperatorStore();
  const { authenticate: authenticateBiometric } = useBiometric();

  const [selectedStaff, setSelectedStaff] = useState<StaffRosterEntry | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | undefined>(undefined);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const { data: rosterData, isLoading: isLoadingRoster, error: rosterError } = useStaffRoster(locationId, isAuthReady);
  const { mutate: verifyPin, isPending: isVerifyingPin } = useVerifyPin();

  // Cache roster in store
  useEffect(() => {
    if (rosterData && rosterData.length > 0) {
      const operators: Operator[] = rosterData.map((entry) => ({
        staffId: entry.staffId,
        clerkUserId: entry.clerkUserId,
        name: entry.name,
        email: '',
        role: entry.role,
        imageUrl: entry.imageUrl,
      }));
      setRoster(operators);
    }
  }, [rosterData, setRoster]);

  // --- Handlers ---

  const handleStaffSelect = useCallback(async (staff: StaffRosterEntry) => {
    setPinError(null);
    setRemainingAttempts(undefined);
    setLockedUntil(null);

    if (!staff.hasPinSet) {
      setSelectedStaff(staff);
      setPinError('No PIN set up yet. Go to Settings after unlocking to create one.');
      return;
    }

    setSelectedStaff(staff);
  }, []);

  const handlePinComplete = useCallback((pin: string) => {
    if (!selectedStaff) return;

    verifyPin(
      { staffId: selectedStaff.staffId, pin },
      {
        onSuccess: (response) => {
          const operator: Operator = {
            staffId: response.staffId,
            clerkUserId: response.clerkUserId,
            name: response.name,
            email: response.email,
            role: response.role,
            imageUrl: selectedStaff.imageUrl,
          };
          switchOperator(operator);
          onUnlock();
        },
        onError: (error) => {
          if (error instanceof APIError) {
            if (error.code === 'INVALID_PIN') {
              setPinError('Incorrect PIN');
              if (error.details && typeof error.details === 'object' && 'remainingAttempts' in error.details) {
                setRemainingAttempts((error.details as { remainingAttempts: number }).remainingAttempts);
              }
            } else if (error.code === 'LOCKED') {
              setPinError('Too many attempts');
              if (error.details && typeof error.details === 'object' && 'lockedUntil' in error.details) {
                setLockedUntil((error.details as { lockedUntil: string }).lockedUntil);
              }
            } else {
              setPinError(error.message);
            }
          } else {
            setPinError('Authentication failed');
          }
        },
      }
    );
  }, [selectedStaff, verifyPin, switchOperator, onUnlock]);

  const handleDeviceOwnerUnlock = useCallback(async () => {
    const success = await authenticateBiometric('Unlock Lunettiq');
    if (success) {
      clearOperator();
      onUnlock();
    }
  }, [authenticateBiometric, clearOperator, onUnlock]);

  const handleBack = useCallback(() => {
    setSelectedStaff(null);
    setPinError(null);
    setRemainingAttempts(undefined);
    setLockedUntil(null);
  }, []);

  const currentRoster: StaffRosterEntry[] = rosterData ?? [];
  const showRoster = !isLoadingRoster && !rosterError && currentRoster.length > 0;

  // Find device owner in roster for display name
  const deviceOwnerEntry = currentRoster.find((s) => s.clerkUserId === deviceOwnerId);
  const deviceOwnerName = deviceOwnerEntry?.name?.split(' ')[0] ?? 'Device owner';

  // --- Render: PIN Entry (staff selected) ---
  if (selectedStaff) {
    return (
      <View style={styles.overlay}>
        <View style={styles.pinScreen}>
          {/* Back button — top left */}
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back to staff selection"
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={C.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          {/* Content centered */}
          <View style={styles.pinContent}>
            <StaffAvatar name={selectedStaff.name} imageUrl={selectedStaff.imageUrl} size={72} />
            <Text style={styles.selectedName}>{selectedStaff.name}</Text>

            {selectedStaff.hasPinSet ? (
              <PinPad
                title="Enter your PIN"
                variant="dark"
                onComplete={handlePinComplete}
                error={pinError}
                disabled={isVerifyingPin}
                remainingAttempts={remainingAttempts}
                lockedUntil={lockedUntil}
              />
            ) : (
              <View style={styles.noPinMessage}>
                <Text style={styles.noPinText}>
                  No PIN set up yet
                </Text>
                <Text style={styles.noPinSubtext}>
                  Use the device owner button below to unlock, then set your PIN in Settings
                </Text>
              </View>
            )}
          </View>

          {/* Device owner unlock — always available as escape hatch */}
          <Pressable
            onPress={handleDeviceOwnerUnlock}
            accessibilityRole="button"
            accessibilityLabel={`Unlock as ${deviceOwnerName} with Face ID`}
            style={styles.deviceOwnerSmall}
          >
            <Fingerprint size={16} color={C.textMuted} />
            <Text style={styles.deviceOwnerSmallText}>
              {'Unlock as ' + deviceOwnerName}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- Render: Roster (main lock screen) ---
  return (
    <View style={styles.overlay}>
      <View style={styles.mainScreen}>
        {/* Branding */}
        <Text style={styles.branding}>LUNETTIQ</Text>

        {/* Middle content */}
        <View style={styles.middleContent}>
          {/* Loading */}
          {isLoadingRoster && (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={C.textMuted} />
            </View>
          )}

          {/* Error */}
          {!isLoadingRoster && rosterError && !showRoster && (
            <View style={styles.centered}>
              {__DEV__ && (
                <Text style={[styles.captionText, { color: C.error }]}>
                  {rosterError instanceof Error ? rosterError.message : 'Roster unavailable'}
                </Text>
              )}
            </View>
          )}

          {/* Staff roster */}
          {showRoster && (
            <View style={styles.rosterSection}>
              <Text style={styles.rosterTitle}>Select your profile</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rosterScroll}
              >
                {currentRoster.map((staff) => {
                  const isOwner = staff.clerkUserId === deviceOwnerId;
                  return (
                    <Pressable
                      key={staff.staffId}
                      onPress={() => isOwner ? handleDeviceOwnerUnlock() : handleStaffSelect(staff)}
                      accessibilityRole="button"
                      accessibilityLabel={`${staff.name}${isOwner ? ', device owner — uses Face ID' : ''}`}
                      style={styles.rosterItem}
                    >
                      <StaffAvatar name={staff.name} imageUrl={staff.imageUrl} size={64} />
                      <Text style={styles.rosterName} numberOfLines={1}>
                        {staff.name.split(' ')[0]}
                      </Text>
                      {isOwner && (
                        <View style={styles.ownerBadge}>
                          <Fingerprint size={10} color={C.textMuted} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Empty state — no roster */}
          {!isLoadingRoster && !rosterError && currentRoster.length === 0 && (
            <View style={styles.centered}>
              <Text style={[styles.rosterTitle, { marginBottom: 8 }]}>
                No staff profiles found
              </Text>
              <Text style={styles.captionText}>
                Set up staff PINs in Settings after unlocking
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Device owner unlock — prominent at bottom */}
        <View style={styles.bottomSection}>
          <Pressable
            onPress={handleDeviceOwnerUnlock}
            accessibilityRole="button"
            accessibilityLabel={`Unlock as ${deviceOwnerName} with Face ID or passcode`}
            style={styles.deviceOwnerButton}
          >
            <Fingerprint size={24} color={C.text} />
            <View style={styles.deviceOwnerButtonText}>
              <Text style={styles.deviceOwnerLabel}>
                {'Unlock as ' + deviceOwnerName}
              </Text>
              <Text style={styles.deviceOwnerHint}>
                Face ID or device passcode
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// --- Staff Avatar ---

function StaffAvatar({ name, imageUrl, size }: { name: string; imageUrl: string | null; size: number }) {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const COLORS = [
    '#2563EB', '#059669', '#7C3AED', '#DB2777',
    '#D97706', '#E11D48', '#4F46E5', '#0D9488',
  ] as const;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const bgColor = COLORS[Math.abs(hash) % COLORS.length]!;

  return (
    <View style={{ width: size, height: size, backgroundColor: bgColor, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: '600', color: C.text }}>
        {initials}
      </Text>
    </View>
  );
}

// --- Styles ---

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.bg,
    zIndex: 999,
  },

  // --- Main lock screen (roster view) ---
  mainScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  branding: {
    fontSize: 24,
    letterSpacing: 8,
    color: C.textSubtle,
    fontWeight: '300',
    marginBottom: 48,
  },
  middleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  centered: {
    alignItems: 'center',
  },
  captionText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
  },

  // --- Roster ---
  rosterSection: {
    alignItems: 'center',
    width: '100%',
  },
  rosterTitle: {
    fontSize: 18,
    color: C.text,
    fontWeight: '400',
    marginBottom: 32,
  },
  rosterScroll: {
    paddingHorizontal: 32,
    gap: 24,
  },
  rosterItem: {
    alignItems: 'center',
    width: 80,
    minHeight: 44,
  },
  rosterName: {
    fontSize: 14,
    color: C.text,
    textAlign: 'center',
    marginTop: 8,
  },
  ownerBadge: {
    marginTop: 4,
    opacity: 0.6,
  },

  // --- Divider ---
  divider: {
    width: 200,
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
    marginVertical: 32,
  },

  // --- Device owner button ---
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  deviceOwnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
    minWidth: 280,
  },
  deviceOwnerButtonText: {
    gap: 2,
  },
  deviceOwnerLabel: {
    fontSize: 16,
    color: C.text,
    fontWeight: '500',
  },
  deviceOwnerHint: {
    fontSize: 14,
    color: C.textMuted,
  },

  // --- PIN screen ---
  pinScreen: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 44,
    minWidth: 44,
    alignSelf: 'flex-start',
    gap: 4,
  },
  backText: {
    fontSize: 16,
    color: C.text,
  },
  pinContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  selectedName: {
    fontSize: 22,
    color: C.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  noPinMessage: {
    alignItems: 'center',
    paddingHorizontal: 48,
    gap: 8,
  },
  noPinText: {
    fontSize: 18,
    color: C.text,
    fontWeight: '400',
  },
  noPinSubtext: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // --- Small device owner on PIN screen ---
  deviceOwnerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    minHeight: 44,
  },
  deviceOwnerSmallText: {
    fontSize: 14,
    color: C.textMuted,
  },
});
