/**
 * Validates required environment variables at app startup.
 * Returns diagnostics instead of crashing deep inside Clerk/API code.
 */

interface EnvDiagnostic {
  key: string;
  status: 'ok' | 'missing' | 'placeholder';
  hint: string;
}

export interface EnvValidationResult {
  valid: boolean;
  diagnostics: EnvDiagnostic[];
}

export function validateEnv(): EnvValidationResult {
  const diagnostics: EnvDiagnostic[] = [];

  // Clerk publishable key
  const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey || clerkKey === '') {
    diagnostics.push({
      key: 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
      status: 'missing',
      hint: 'Add your Clerk publishable key to .env.local',
    });
  } else if (clerkKey === 'pk_test_...' || clerkKey.endsWith('...')) {
    diagnostics.push({
      key: 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
      status: 'placeholder',
      hint: 'Replace the placeholder in .env.local with your real Clerk key from dashboard.clerk.com',
    });
  } else if (!clerkKey.startsWith('pk_test_') && !clerkKey.startsWith('pk_live_')) {
    diagnostics.push({
      key: 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
      status: 'placeholder',
      hint: 'Key must start with pk_test_ or pk_live_ — check Clerk dashboard',
    });
  } else {
    diagnostics.push({ key: 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', status: 'ok', hint: '' });
  }

  // Foundry base URL
  const foundryUrl = process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL;
  if (!foundryUrl || foundryUrl === '') {
    diagnostics.push({
      key: 'EXPO_PUBLIC_FOUNDRY_BASE_URL',
      status: 'missing',
      hint: 'Add EXPO_PUBLIC_FOUNDRY_BASE_URL to .env.local (e.g. http://lunettiq.localhost:4000)',
    });
  } else {
    diagnostics.push({ key: 'EXPO_PUBLIC_FOUNDRY_BASE_URL', status: 'ok', hint: '' });
  }

  return {
    valid: diagnostics.every((d) => d.status === 'ok'),
    diagnostics,
  };
}
