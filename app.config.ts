import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Lunettiq',
  slug: 'lunettiq-ipad',
  version: '0.1.0',
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'lunettiq',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A153D',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.lunettiq.ipad',
    requireFullScreen: false,
    infoPlist: {
      NSCameraUsageDescription: 'Lunettiq uses the camera to capture fitting photos and Second Sight trade-in documentation.',
      NSPhotoLibraryUsageDescription: 'Lunettiq saves fitting session photos to your device.',
      UIRequiredDeviceCapabilities: ['armv7', 'camera-flash'],
    },
  },
  plugins: [
    'expo-router',
    'expo-camera',
    'expo-secure-store',
    ['expo-image', { photosPermission: 'Allow Lunettiq to save fitting photos.' }],
    '@nozbe/watermelondb/expo-plugin',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    foundryBaseUrl: process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL ?? 'http://lunettiq.localhost:4000',
  },
});
