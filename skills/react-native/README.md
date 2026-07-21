# React Native Skill

This skill provides React Native component and API reference for the AI agent.

## Usage

Reference RN patterns when building:
- Custom components with NativeWind styling
- Gesture handling (react-native-gesture-handler)
- Animations (react-native-reanimated)
- Navigation patterns (via Expo Router)
- FlatList optimization
- Platform-specific code

## Key Libraries

| Library | Purpose | Docs |
|---------|---------|------|
| NativeWind | Tailwind CSS for RN | https://www.nativewind.dev/ |
| react-native-reanimated | Performant animations | https://docs.swmansion.com/react-native-reanimated/ |
| react-native-gesture-handler | Touch/gesture handling | https://docs.swmansion.com/react-native-gesture-handler/ |
| react-native-screens | Native navigation containers | https://github.com/software-mansion/react-native-screens |
| react-native-mmkv | Fast key-value storage | https://github.com/mrousavy/react-native-mmkv |
| WatermelonDB | Offline-first database | https://watermelondb.dev/ |
| TanStack Query | Server state management | https://tanstack.com/query/latest |
| Zustand | Client state management | https://zustand-demo.pmnd.rs/ |

## iPad-Specific Patterns

- Always design for landscape-first (12.9" iPad Pro)
- Split views: left panel (list) + right panel (detail)
- Popovers instead of full-screen modals for small selections
- Respect iPad multitasking (slide over, split view)
- Support both touch and Apple Pencil input

## Performance Patterns

- `FlatList` with `keyExtractor` + `getItemLayout` for fixed heights
- `useCallback` for render callbacks passed to list items
- `useMemo` for expensive computations (scoring, filtering)
- `React.memo` for pure list item components
- `removeClippedSubviews` on long lists
