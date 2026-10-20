import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useClients } from '@/src/api/useClients';
import { Avatar } from '@/src/ui/Avatar';
import { ListRow, kitColors } from '@/src/ui/kit';
import { formatPhone } from '@/src/ui/kit/format';
import type { Client } from '@/src/api/clients.types';
import { useT } from '@/src/i18n';

export const clientName = (c: Client) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'No name yet';

/** Wait for a pause in typing before querying (one request per word, not per letter). */
export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Find a client — the one search pattern for Clients, Walk-in, Link client and booking.
 *
 * Built for the on-screen keyboard: the field stays at the top, results fill the space
 * down to the keyboard (give this a flex-1 parent, e.g. a `fill` Sheet with
 * `scroll={false}`), Return picks the highlighted top result, and dragging the list
 * dismisses the keyboard to see more.
 */
export function ClientSearch({
  onPick, trailing, placeholder, autoFocus = true, excludeIds, emptyHint, selectedId, header,
}: {
  onPick: (client: Client) => void;
  /** Per-row action (e.g. a "Start visit" button). Rows are tappable either way. */
  trailing?: (client: Client) => ReactNode;
  placeholder?: string;
  autoFocus?: boolean;
  excludeIds?: string[];
  /** Shown when a search finds nothing. */
  emptyHint?: string;
  selectedId?: string | null;
  /** Rendered above the results when the field is empty (e.g. recent clients). */
  header?: ReactNode;
}) {
  const tr = useT();
  const [query, setQuery] = useState('');
  const input = useRef<TextInput>(null);
  const q = useDebounced(query.trim());
  const active = q.length >= 2;
  const { data, isFetching } = useClients(active ? { q, limit: 25 } : { limit: 0 });
  const results = active ? (data?.clients ?? []).filter((c) => !excludeIds?.includes(c.id)) : [];
  const waiting = query.trim().length >= 2 && (q !== query.trim() || isFetching);

  return (
    <View className="flex-1">
      <View className="px-[20px] pt-[12px] pb-[10px] border-b border-border">
        <View className="flex-row items-center bg-bg-page border border-border-strong rounded-md px-[12px] min-h-[48px] gap-[8px]">
          <Search size={18} color={kitColors.iconMuted} />
          <TextInput
            ref={input}
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder ?? tr('search.placeholder')}
            placeholderTextColor={kitColors.iconMuted}
            className="flex-1 text-body-lg text-text-primary py-[10px]"
            autoFocus={autoFocus}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="search"
            enablesReturnKeyAutomatically
            blurOnSubmit={false}
            onSubmitEditing={() => { if (results[0]) onPick(results[0]); }}
            accessibilityLabel={tr('search.a11y')}
          />
          {query ? (
            <Pressable onPress={() => { setQuery(''); input.current?.focus(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr('search.clear')}>
              <X size={18} color={kitColors.iconMuted} />
            </Pressable>
          ) : null}
        </View>
        {active && results.length > 0 ? (
          <Text className="text-body-sm text-text-tertiary mt-[6px]">
            {tr(results.length === 1 ? 'search.matchOne' : 'search.matchMany', { count: results.length })} · {waiting ? tr('search.searching') : tr('search.returnOpens')}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={false}
        renderItem={({ item, index }) => (
          <ListRow
            divider={index > 0}
            selected={item.id === selectedId || index === 0}
            onPress={() => onPick(item)}
            leading={<Avatar size="sm" firstName={item.firstName ?? ''} lastName={item.lastName ?? ''} />}
            title={clientName(item)}
            subtitle={[item.email, item.phone ? formatPhone(item.phone) : null].filter(Boolean).join(' · ') || undefined}
            trailing={trailing?.(item)}
          />
        )}
        ListEmptyComponent={
          <View className="px-[20px] py-[16px]">
            {!active ? (header ?? <Text className="text-body-sm text-text-tertiary">{tr('search.typeMore')}</Text>)
              : waiting ? <Text className="text-body-sm text-text-tertiary">{tr('search.searchingLong')}</Text>
              : <Text className="text-body-sm text-text-tertiary">{emptyHint ?? tr('search.none', { q })}</Text>}
          </View>
        }
      />
    </View>
  );
}
