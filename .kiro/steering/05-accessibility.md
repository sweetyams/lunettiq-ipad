---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---
# Accessibility

## VoiceOver

Every interactive element must be labeled:
```tsx
// ✅ Icon-only button
<Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete item">
  <TrashIcon />
</Pressable>

// ✅ Complex row — combine children into one announcement
<View accessibilityRole="button" accessibilityLabel={`${client.name}, ${client.tier} member, ${client.orderCount} orders`}>
  <Text>{client.name}</Text>
  <Badge>{client.tier}</Badge>
</View>
```

## Dynamic Type

- All text must scale with system font size settings
- Never use fixed heights on text containers
- Test at largest accessibility size

## Color Contrast

- Minimum 4.5:1 for body text (WCAG AA)
- Minimum 3:1 for large text (22pt+) and UI components
- In client-visible mode: target AAA (7:1) — client may not have glasses
- Never rely on color alone — always pair with icon or text

## Touch Targets

**44pt × 44pt minimum.** Test with Accessibility Inspector.

```tsx
// ✅ Correct — meets minimum
<Pressable className="p-3 min-w-[44px] min-h-[44px]" hitSlop={8}>

// ❌ Wrong — too small
<Pressable className="p-1">
```

## Focus Management

Tab order should follow visual reading order. Use `accessibilityViewIsModal` for sheets/modals.

## Testing Checklist

- [ ] VoiceOver can reach all interactive elements in order
- [ ] Labels are descriptive (not "button 1", "image")
- [ ] Content scales at Dynamic Type XXL without truncation
- [ ] No info conveyed by color alone
- [ ] Touch targets ≥ 44pt
- [ ] Client-visible mode maintains AAA contrast
