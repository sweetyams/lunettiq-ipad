/**
 * DesignTokenProvider
 *
 * Fetches GET /api/design/native at cold boot — no auth required.
 * Caches in MMKV keyed by meta.version. Skips re-apply if version unchanged.
 *
 * Boot sequence:
 *  1. Read MMKV for last-known tokens → render immediately with cached values
 *  2. Fetch /api/design/native in background
 *  3a. If meta.version matches cache key → do nothing
 *  3b. If version differs (or no cache) → write to MMKV, update context
 *
 * This means:
 *  - First ever boot: fallback tokens render, then real tokens apply after ~100ms
 *  - Subsequent boots: cached tokens render instantly, update in background if changed
 *  - Offline boot: cached tokens serve forever, no error
 *  - Brand change in Foundry: propagates on next boot after CDN cache expires (60s)
 */
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MMKV } from 'react-native-mmkv';
import { FALLBACK_DESIGN_TOKENS } from './design-tokens.fallback';
import type { NativeDesignTokens } from './design-tokens.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL
  ?? (__DEV__ ? 'http://lunettiq.localhost:4000' : 'https://lunettiq.bentspline.com');

const ENDPOINT = `${BASE_URL}/api/design/native`;

/** MMKV storage instance — separate from main app storage to isolate design concerns */
const storage = new MMKV({ id: 'design-tokens' });

/** MMKV key where the current token payload is stored */
const TOKENS_KEY = 'tokens';

/** MMKV key where the current version hash is stored */
const VERSION_KEY = 'version';

// ─── Context ──────────────────────────────────────────────────────────────────

interface DesignTokenContextValue {
  tokens: NativeDesignTokens;
  /** True until the first network fetch completes (or fails) */
  isLoading: boolean;
  /** Non-null if the network fetch failed — tokens will be the last-cached or fallback values */
  error: string | null;
  /** Force re-fetch, e.g. after settings change */
  refresh: () => void;
}

const DesignTokenContext = createContext<DesignTokenContextValue | null>(null);

// ─── Cache helpers ────────────────────────────────────────────────────────────

function readCachedTokens(): NativeDesignTokens | null {
  try {
    const raw = storage.getString(TOKENS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NativeDesignTokens;
  } catch {
    return null;
  }
}

function writeCachedTokens(tokens: NativeDesignTokens): void {
  try {
    storage.set(TOKENS_KEY, JSON.stringify(tokens));
    storage.set(VERSION_KEY, tokens.meta.version);
  } catch {
    // MMKV write failure is non-fatal — tokens still apply from state
  }
}

function readCachedVersion(): string | null {
  return storage.getString(VERSION_KEY) ?? null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface DesignTokenProviderProps {
  children: ReactNode;
}

export function DesignTokenProvider({ children }: DesignTokenProviderProps): React.JSX.Element {
  // Start with cached tokens if available, otherwise fallback
  const [tokens, setTokens] = useState<NativeDesignTokens>(
    () => readCachedTokens() ?? FALLBACK_DESIGN_TOKENS
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchTokens(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(ENDPOINT, {
          method: 'GET',
          // No Authorization header — /api/design/native is public
          // No X-Found-Surface — not an authenticated call
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json() as { data: NativeDesignTokens };
        const fresh = json.data;

        if (cancelled) return;

        // Version check — skip re-render if nothing changed
        const cachedVersion = readCachedVersion();
        if (cachedVersion === fresh.meta.version) {
          // Same version — no UI update needed, but still mark loading done
          setIsLoading(false);
          return;
        }

        // New version — cache and apply
        writeCachedTokens(fresh);
        setTokens(fresh);
        setIsLoading(false);

        if (__DEV__) {
          console.log(
            `[DesignTokens] Applied version ${fresh.meta.version} (was: ${cachedVersion ?? 'none'})`
          );
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setIsLoading(false);

        if (__DEV__) {
          console.warn(`[DesignTokens] Fetch failed: ${message} — using cached/fallback tokens`);
        }
        // Non-fatal: tokens remain at whatever was in state (cached or fallback)
      }
    }

    fetchTokens();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const refresh = (): void => setRefreshKey(k => k + 1);

  return (
    <DesignTokenContext.Provider value={{ tokens, isLoading, error, refresh }}>
      {children}
    </DesignTokenContext.Provider>
  );
}

// ─── Internal hook — used by useDesignTokens ──────────────────────────────────

export function useDesignTokenContext(): DesignTokenContextValue {
  const ctx = useContext(DesignTokenContext);
  if (!ctx) {
    throw new Error('useDesignTokenContext must be used inside <DesignTokenProvider>');
  }
  return ctx;
}
