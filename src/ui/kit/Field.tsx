import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { useState, type ReactNode } from 'react';
import { kitColors } from './colors';

/**
 * Field — sentence-case label, control, quiet hint or red error (Found UI
 * form field). Labels are never uppercase.
 */
export function Field({ label, hint, error, required, children, className }: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={`gap-[6px] ${className ?? ''}`}>
      <Text className="text-body-sm font-medium text-text-secondary">
        {label}
        {required ? <Text className="text-text-tertiary"> · required</Text> : null}
      </Text>
      {children}
      {error ? <Text className="text-body-sm text-error">{error}</Text> : hint ? <Text className="text-body-sm text-text-tertiary">{hint}</Text> : null}
    </View>
  );
}

/** White input with a hairline; focus darkens the ring, errors turn it red. */
export function TextField({ label, hint, error, required, multiline, className, style, ...input }: TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const ring = error ? 'border-error' : focused ? 'border-text-tertiary' : 'border-border';
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      <TextInput
        {...input}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={kitColors.iconMuted}
        onFocus={(e) => { setFocused(true); input.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); input.onBlur?.(e); }}
        accessibilityLabel={input.accessibilityLabel ?? label}
        className={`bg-bg-page border rounded-md px-[12px] text-body-md text-text-primary ${ring} ${multiline ? 'min-h-[120px] py-[10px]' : 'min-h-[44px]'}`}
        style={style}
      />
    </Field>
  );
}
