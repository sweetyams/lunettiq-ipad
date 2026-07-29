/**
 * ProfileSectionCard — Unified card for every profile section.
 *
 * Pattern: Title + action link | View content | Empty state CTA.
 * Tapping "Edit" (or the CTA) opens a ProfileEditModal with all fields editable.
 * Used for: Contact, Fit Profile, Preferences, Insurance, Lifestyle, Notes, etc.
 */
import { View, Text, Pressable } from 'react-native';

// ─── Types ───────────────────────────────────────────────────

export interface KeyValueRow {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
}

export interface ChipGroup {
  label: string;
  values: string[];
  inverted?: boolean; // "Avoid" style
}

interface ProfileSectionCardProps {
  /** Card title */
  title: string;
  /** Action label shown in card header (default: "Edit") */
  actionLabel?: string;
  /** Fires when the action link is tapped */
  onAction: () => void;
  /** Key-value rows to display */
  rows?: KeyValueRow[];
  /** Chip groups to display (preferences style) */
  chips?: ChipGroup[];
  /** Custom content (for complex layouts like wishlist thumbnails) */
  children?: React.ReactNode;
  /** Empty state message when there's no data */
  emptyMessage?: string;
  /** CTA button label for empty state (default: same as actionLabel) */
  emptyCta?: string;
  /** Whether the section is considered empty (shows empty state) */
  isEmpty?: boolean;
  /** Staff-only indicator */
  staffOnly?: boolean;
  /** Additional note below the title */
  subtitle?: string;
}

export function ProfileSectionCard({
  title,
  actionLabel = 'Edit',
  onAction,
  rows,
  chips,
  children,
  emptyMessage,
  emptyCta,
  isEmpty = false,
  staffOnly = false,
  subtitle,
}: ProfileSectionCardProps) {
  const hasContent = !isEmpty && (
    (rows && rows.some(r => r.value != null && r.value !== '')) ||
    (chips && chips.some(g => g.values.length > 0)) ||
    children
  );

  return (
    <View className="bg-bg-surface rounded-lg border border-border">
      {/* Header */}
      <View className="flex-row items-baseline justify-between px-md py-sm border-b border-border">
        <View className="flex-row items-center gap-sm">
          <Text className="text-body-md text-text-primary font-semibold">{title}</Text>
          {staffOnly && (
            <Text className="text-caption-sm text-text-muted">staff only</Text>
          )}
        </View>
        <Pressable
          onPress={onAction}
          className="min-h-[44px] min-w-[44px] justify-center items-end"
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
          hitSlop={8}
        >
          <Text className="text-body-sm text-text-primary underline underline-offset-2">
            {hasContent ? actionLabel : (emptyCta || actionLabel)}
          </Text>
        </Pressable>
      </View>

      {/* Body */}
      <View className="px-md py-sm">
        {subtitle && (
          <Text className="text-body-sm text-text-muted mb-sm">{subtitle}</Text>
        )}

        {hasContent ? (
          <>
            {/* Key-Value Rows */}
            {rows && rows.map((row, i) => (
              <View
                key={row.label}
                className={`flex-row justify-between items-baseline py-sm ${
                  i < rows.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <Text className="text-body-sm text-text-muted">{row.label}</Text>
                <Text className={`text-body-sm ${
                  row.value != null && row.value !== '' 
                    ? 'text-text-primary' 
                    : 'text-text-muted italic'
                }`}>
                  {row.value != null && row.value !== '' 
                    ? `${row.value}${row.suffix || ''}` 
                    : 'Not set'}
                </Text>
              </View>
            ))}

            {/* Chip Groups */}
            {chips && chips.map((group) => (
              <View key={group.label} className="py-sm">
                <Text className="text-body-sm text-text-muted mb-xs">{group.label}</Text>
                <View className="flex-row flex-wrap gap-xs">
                  {group.values.length > 0 ? (
                    group.values.map((v) => (
                      <View
                        key={v}
                        className={`px-sm py-xs rounded-md border ${
                          group.inverted
                            ? 'bg-bg-inverse border-bg-inverse'
                            : 'bg-bg-muted border-border'
                        }`}
                      >
                        <Text className={`text-caption-md ${
                          group.inverted 
                            ? 'text-text-inverse line-through' 
                            : 'text-text-primary'
                        }`}>
                          {v}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-body-sm text-text-muted italic">None</Text>
                  )}
                </View>
              </View>
            ))}

            {/* Custom children */}
            {children}
          </>
        ) : (
          /* Empty State */
          <Pressable onPress={onAction} className="py-lg items-center">
            <Text className="text-body-sm text-text-muted italic text-center">
              {emptyMessage || `No ${title.toLowerCase()} recorded yet.`}
            </Text>
            <Text className="text-body-sm text-brand mt-sm font-medium">
              {emptyCta || `Add ${title.toLowerCase()}`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
