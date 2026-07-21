import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react-native';
import { useAiStylist } from '@/src/api/useAiStylist';
import type { AiStylistResponse } from '@/src/api/aiStylist.types';

interface AiStylistPanelProps {
  clientId: string;
  onChipPress?: (chip: string) => void;
}

/**
 * AI Stylist panel for session workspace (SES-01 right panel).
 * SA can trigger on-demand AI advisory. Returns a thought paragraph
 * and tappable chip buttons that suggest actions.
 */
export function AiStylistPanel({ clientId, onChipPress }: AiStylistPanelProps) {
  const [context, setContext] = useState('');
  const [lastResult, setLastResult] = useState<AiStylistResponse | null>(null);
  const aiStylist = useAiStylist();

  const handleAsk = useCallback(() => {
    aiStylist.mutate(
      { clientId, context: context.trim() || undefined },
      { onSuccess: (data) => setLastResult(data) }
    );
  }, [clientId, context, aiStylist]);

  const handleChipPress = useCallback((chip: string) => {
    onChipPress?.(chip);
  }, [onChipPress]);

  return (
    <View className="mb-lg">
      <View className="flex-row items-center mb-sm">
        <Sparkles size={16} color="#16A34A" />
        <Text className="text-text-primary text-bodyStrong ml-xs">AI Stylist</Text>
      </View>

      <View className="bg-bg-page rounded-lg p-md border border-border">
        {/* Context input */}
        <TextInput
          value={context}
          onChangeText={setContext}
          placeholder="What's the client looking for? (optional)"
          placeholderTextColor="#6B6B6B"
          className="bg-bg-elevated border border-border rounded-lg px-md py-sm text-text-primary text-body mb-sm"
          accessibilityLabel="Styling context"
          accessibilityHint="Describe what the client wants to help the AI give better suggestions"
        />

        {/* Trigger button */}
        <Pressable
          onPress={handleAsk}
          disabled={aiStylist.isPending}
          accessibilityRole="button"
          accessibilityLabel="Get AI styling suggestions"
          className={`min-h-[44px] rounded-md items-center justify-center flex-row ${
            aiStylist.isPending ? 'bg-brand/60' : 'bg-success'
          }`}
        >
          {aiStylist.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Sparkles size={16} color="#FFFFFF" />
              <Text className="text-white text-body font-medium ml-xs">
                Suggest frames
              </Text>
            </>
          )}
        </Pressable>

        {/* Error */}
        {aiStylist.isError && (
          <Text className="text-color-error text-caption mt-sm">
            {aiStylist.error?.message ?? 'Something went wrong'}
          </Text>
        )}

        {/* Result: thought + chips */}
        {lastResult && (
          <View className="mt-md">
            {/* Thought paragraph */}
            <Text className="text-body text-text-primary leading-relaxed mb-md">
              {lastResult.thought}
            </Text>

            {/* Action chips */}
            {lastResult.chips.length > 0 && (
              <View className="flex-row flex-wrap gap-sm">
                {lastResult.chips.map((chip, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleChipPress(chip)}
                    accessibilityRole="button"
                    accessibilityLabel={chip}
                    className="min-h-[44px] bg-bg-elevated border border-border rounded-full px-md py-sm"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-caption font-medium text-text-primary">
                      {chip}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
