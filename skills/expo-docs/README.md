# Expo Documentation Skill

This skill provides searchable Expo SDK documentation for the AI agent.

## Usage

Reference Expo APIs, configuration, and patterns when building features that use:
- Expo Router (file-based routing)
- expo-camera (photo capture, burst mode)
- expo-image (optimized image display)
- expo-secure-store (credential storage)
- expo-local-authentication (biometric unlock)
- expo-file-system (local file management)
- EAS Build & Update (build profiles, OTA)

## Key References

| Topic | Expo Docs URL |
|-------|---------------|
| Expo Router | https://docs.expo.dev/router/introduction/ |
| Camera | https://docs.expo.dev/versions/latest/sdk/camera/ |
| Image | https://docs.expo.dev/versions/latest/sdk/image/ |
| File System | https://docs.expo.dev/versions/latest/sdk/filesystem/ |
| Secure Store | https://docs.expo.dev/versions/latest/sdk/securestore/ |
| Local Auth | https://docs.expo.dev/versions/latest/sdk/local-authentication/ |
| EAS Build | https://docs.expo.dev/build/introduction/ |
| EAS Update | https://docs.expo.dev/eas-update/introduction/ |
| app.config.ts | https://docs.expo.dev/workflow/configuration/ |

## Patterns

When the agent needs Expo-specific guidance:
1. Check this skill for the relevant API
2. Follow Expo's recommended patterns (managed workflow)
3. Prefer expo-* packages over bare react-native equivalents
4. Use EAS for builds — never bare `xcodebuild`
