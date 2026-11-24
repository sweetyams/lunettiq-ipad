/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: 'Lunettiq',
  slug: 'lunettiq-ipad',
  version: '0.1.0',
  // Landscape-first (the in-store case) but usable in portrait; layouts key off useLayout().
  orientation: 'default',
  platforms: ['ios'],
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'lunettiq',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.lunettiq.ipad',
    // Required for iPadOS to honour the orientation lock (no Split View / Slide Over).
    requireFullScreen: true,
    infoPlist: {
      NSCameraUsageDescription: 'Lunettiq uses the camera to capture fitting photos and Second Sight trade-in documentation.',
      NSPhotoLibraryUsageDescription: 'Allow Lunettiq to save fitting photos.',
      ITSAppUsesNonExemptEncryption: false,
      UIRequiredDeviceCapabilities: ['armv7', 'camera-flash'],
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
        NSExceptionDomains: {
          'lunettiq.localhost': {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSIncludesSubdomains: true,
          },
          localhost: {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSIncludesSubdomains: true,
          },
        },
      },
    },
  },
  plugins: [
    'expo-router',
    'expo-camera',
    'expo-secure-store',
    './plugins/withSimdjson',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        // Same dark ground as the PIN lock and sign-in brand panel (bg-inverse).
        backgroundColor: '#111111',
        imageWidth: 360,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '6a335bcd-0d56-4a98-b64f-c9c1c23df9c2',
    },
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    foundryBaseUrl: process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL ?? 'http://lunettiq.localhost:4000',
  },
});
