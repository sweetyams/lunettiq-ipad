/// <reference types="expo/types" />
/// <reference types="nativewind/types" />

// Env variables
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    EXPO_PUBLIC_FOUNDRY_BASE_URL?: string;
  }
}