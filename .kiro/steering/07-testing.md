---
inclusion: fileMatch
fileMatchPattern: "**/*.test.*,**/tests/**"
---
# Testing Contract

## Stack

- **Vitest** — test runner (fast, ESM-native)
- **React Native Testing Library** — component tests
- **MSW (Mock Service Worker)** — API mocking

## What to test

| Layer | What | How |
|-------|------|-----|
| API hooks | Data fetching, caching, error states | `renderHook` + MSW |
| Stores | State transitions, actions | Direct store calls |
| Components | Render states, interactions | RNTL `render` + `fireEvent` |
| Sync engine | Queue operations, conflict resolution | Unit tests |
| Business logic | Fit calculation, scoring | Pure function tests |

## Component Test Pattern

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ClientCard } from './ClientCard';

describe('ClientCard', () => {
  const mockClient = { id: '1', name: 'Marie D.', tier: 'cult', orderCount: 5 };

  it('renders client name and tier', () => {
    render(<ClientCard client={mockClient} onPress={jest.fn()} />);
    expect(screen.getByText('Marie D.')).toBeTruthy();
    expect(screen.getByText('CULT')).toBeTruthy();
  });

  it('calls onPress with client id', () => {
    const onPress = jest.fn();
    render(<ClientCard client={mockClient} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('hides tier in client-visible mode', () => {
    render(<ClientCard client={mockClient} onPress={jest.fn()} privacyMode="client" />);
    expect(screen.queryByText('CULT')).toBeNull();
  });
});
```

## API Hook Test Pattern

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useClients } from './useClients';

// MSW handler
server.use(
  http.get('*/api/clients', () => HttpResponse.json({ data: [mockClient] }))
);

it('fetches clients', async () => {
  const { result } = renderHook(() => useClients(), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(1);
});
```

## Rules

- Every screen component gets a test covering all 4 states (loading, error, empty, content)
- Every API hook gets a test covering success + error
- Every store gets a test covering key transitions
- Offline scenarios: test component behavior when `isOnline = false`
- Privacy mode: test that sensitive data is hidden when `privacyMode = 'client'`
- No testing implementation details — test behavior, not structure

## Naming

```
{Component}.test.tsx
use{Hook}.test.ts
{store}.test.ts
```

Pattern: `it('does X when Y')` — describe behavior, not implementation.
