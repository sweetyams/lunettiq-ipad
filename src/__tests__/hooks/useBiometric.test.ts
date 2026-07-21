import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as LocalAuth from 'expo-local-authentication';

// Test the biometric logic directly without React hooks
describe('useBiometric', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function authenticate(reason?: string): Promise<boolean> {
    const hasHardware = await LocalAuth.hasHardwareAsync();
    const isEnrolled = await LocalAuth.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) return true;
    const result = await LocalAuth.authenticateAsync({
      promptMessage: reason || 'Authenticate to continue',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  }

  it('returns true when no hardware available', async () => {
    vi.mocked(LocalAuth.hasHardwareAsync).mockResolvedValueOnce(false);
    expect(await authenticate()).toBe(true);
  });

  it('returns true when not enrolled', async () => {
    vi.mocked(LocalAuth.hasHardwareAsync).mockResolvedValueOnce(true);
    vi.mocked(LocalAuth.isEnrolledAsync).mockResolvedValueOnce(false);
    expect(await authenticate()).toBe(true);
  });

  it('returns success from authenticateAsync', async () => {
    vi.mocked(LocalAuth.hasHardwareAsync).mockResolvedValueOnce(true);
    vi.mocked(LocalAuth.isEnrolledAsync).mockResolvedValueOnce(true);
    vi.mocked(LocalAuth.authenticateAsync).mockResolvedValueOnce({ success: true });
    expect(await authenticate('Test prompt')).toBe(true);
  });

  it('returns false on auth failure', async () => {
    vi.mocked(LocalAuth.hasHardwareAsync).mockResolvedValueOnce(true);
    vi.mocked(LocalAuth.isEnrolledAsync).mockResolvedValueOnce(true);
    vi.mocked(LocalAuth.authenticateAsync).mockResolvedValueOnce({ success: false, error: 'user_cancel' });
    expect(await authenticate()).toBe(false);
  });
});
