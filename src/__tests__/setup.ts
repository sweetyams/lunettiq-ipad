import { vi } from 'vitest';

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Modal: 'Modal',
  Alert: { alert: vi.fn() },
  Vibration: { vibrate: vi.fn() },
  AppState: { addEventListener: vi.fn(() => ({ remove: vi.fn() })) },
  useWindowDimensions: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock('react-native-mmkv', () => ({
  MMKV: vi.fn(() => ({
    getString: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('@nozbe/watermelondb', () => ({
  Database: vi.fn(),
  Model: class {},
  Q: { where: vi.fn(), and: vi.fn(), or: vi.fn() },
  tableSchema: vi.fn((s: any) => s),
  appSchema: vi.fn((s: any) => s),
}));

vi.mock('@nozbe/watermelondb/adapters/sqlite', () => ({
  default: vi.fn(),
}));

vi.mock('@/src/db', () => ({
  database: { get: vi.fn(), write: vi.fn(), read: vi.fn() },
  getDatabase: vi.fn(),
}));

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(async () => true),
  isEnrolledAsync: vi.fn(async () => true),
  authenticateAsync: vi.fn(async () => ({ success: true })),
}));

vi.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: vi.fn(() => [{ granted: true }, vi.fn()]),
}));

vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() })),
  useLocalSearchParams: vi.fn(() => ({})),
}));

vi.mock('lucide-react-native', () => new Proxy({}, {
  get: () => 'MockIcon',
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: null, isLoading: false, error: null })),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn() })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: any) => children,
}));
