/**
 * ConfiguratorSheet — full multi-step lens configurator.
 *
 * Flow:
 *   1. Resolve which flow applies to this product
 *   2. Load the published snapshot (steps → groups → choices)
 *   3. Step-by-step selection UI
 *   4. Summary step with pricing
 *   5. onComplete(cartResult, priceSummary) → caller creates Rx order
 *
 * Design: Native modal sheet, progress bar, choice cards, single green CTA per step.
 */
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react-native';
import {
  useConfiguratorResolve,
  useConfiguratorSnapshot,
  useLensColours,
  serializeSelections,
  isStepComplete,
  computePriceDelta,
} from '@/src/api/useConfigurator';
import { Button } from '@/src/ui/Button';
import type {
  SnapshotStep,
  SnapshotGroup,
  SnapshotChoice,
  ConfiguratorSelections,
  ColourSelections,
  CartResult,
  ConfiguratorPriceSummary,
  LensColour,
} from '@/src/api/configurator.types';

// ─── Choice Card ────────────────────────────────────────────────────────────

interface ChoiceCardProps {
  choice: SnapshotChoice;
  isSelected: boolean;
  onPress: () => void;
  priceDelta: number; // cents
}

function ChoiceCard({ choice, isSelected, onPress, priceDelta }: ChoiceCardProps) {
  const label = choice.label?.en ?? choice.code;
  const description = choice.description?.en;
  const price = priceDelta > 0 ? `+$${(priceDelta / 100).toFixed(2)}` : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${label}${price ? `, ${price}` : ''}`}
      className={`min-h-[44px] border rounded-lg p-md mb-sm flex-row items-center ${
        isSelected
          ? 'border-green bg-green/10'
          : 'border-border bg-bg-surface'
      }`}
    >
      {/* Selection indicator */}
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-md flex-shrink-0 ${
          isSelected ? 'border-green bg-green' : 'border-border'
        }`}
      >
        {isSelected && <Check size={14} color="white" />}
      </View>

      {/* Label + description */}
      <View className="flex-1">
        <Text className={`text-body ${isSelected ? 'text-text-primary font-medium' : 'text-text-primary'}`}>
          {label}
        </Text>
        {description && (
          <Text className="text-caption text-text-muted mt-xs">{description}</Text>
        )}
      </View>

      {/* Price delta */}
      {price && (
        <Text className="text-bodyStrong text-text-primary ml-md">{price}</Text>
      )}
    </Pressable>
  );
}

// ─── Colour Swatch ──────────────────────────────────────────────────────────

interface ColourSwatchProps {
  colour: LensColour;
  isSelected: boolean;
  onPress: () => void;
}

function ColourSwatch({ colour, isSelected, onPress }: ColourSwatchProps) {
  const priceLabel = colour.price > 0 ? `+$${(colour.price / 100).toFixed(0)}` : 'Included';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${colour.label}${colour.price > 0 ? `, +$${(colour.price / 100).toFixed(2)}` : ''}`}
      className={`items-center mr-md mb-md`}
    >
      <View
        className={`w-12 h-12 rounded-full border-4 mb-xs ${
          isSelected ? 'border-green' : 'border-transparent'
        }`}
        style={{
          backgroundColor: colour.hexStart,
          // Gradient not natively supported — show start colour; hexEnd is visual only
        }}
      />
      <Text className="text-caption text-text-primary text-center" numberOfLines={2} style={{ maxWidth: 56 }}>
        {colour.label}
      </Text>
      <Text className="text-caption text-text-muted text-center">{priceLabel}</Text>
    </Pressable>
  );
}

// ─── Group Component ─────────────────────────────────────────────────────────

interface GroupProps {
  group: SnapshotGroup;
  choices: SnapshotChoice[];
  selections: ConfiguratorSelections;
  colourSelections: ColourSelections;
  priceRuleMap: Map<string, number>;
  lensColoursBySet: Map<string, LensColour[]>;
  onToggleChoice: (groupId: string, choiceId: string, selectionType: 'single' | 'multiple') => void;
  onSelectColour: (compositeKey: string, colourId: string) => void;
}

function GroupSection({
  group,
  choices,
  selections,
  colourSelections,
  priceRuleMap,
  lensColoursBySet,
  onToggleChoice,
  onSelectColour,
}: GroupProps) {
  const groupChoices = choices.filter((c) => c.groupId === group.id);
  const selectedIds = selections[group.id] ?? [];

  return (
    <View className="mb-xl">
      <View className="flex-row items-center mb-md">
        <Text className="text-headline text-text-primary flex-1">
          {group.label?.en ?? group.code}
        </Text>
        {group.isRequired && (
          <Text className="text-caption text-error ml-sm">Required</Text>
        )}
      </View>

      {groupChoices.map((choice) => {
        const isSelected = selectedIds.includes(choice.id);
        const priceDelta = priceRuleMap.get(choice.id) ?? 0;

        if (choice.choiceType === 'colour' && isSelected && choice.lensColourSetId) {
          const colours = lensColoursBySet.get(choice.lensColourSetId) ?? [];
          const colourKey = `${group.id}:${choice.id}:colour`;
          const selectedColourId = colourSelections[colourKey];

          return (
            <View key={choice.id}>
              <ChoiceCard
                choice={choice}
                isSelected={isSelected}
                onPress={() => onToggleChoice(group.id, choice.id, group.selectionType)}
                priceDelta={priceDelta}
              />
              {/* Colour swatches below selected colour choice */}
              {isSelected && colours.length > 0 && (
                <View className="ml-xl mb-md">
                  <Text className="text-caption text-text-muted mb-sm">Select colour:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row flex-wrap">
                      {colours.map((colour) => (
                        <ColourSwatch
                          key={colour.id}
                          colour={colour}
                          isSelected={selectedColourId === colour.id}
                          onPress={() => onSelectColour(colourKey, colour.id)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          );
        }

        return (
          <ChoiceCard
            key={choice.id}
            choice={choice}
            isSelected={isSelected}
            onPress={() => onToggleChoice(group.id, choice.id, group.selectionType)}
            priceDelta={priceDelta}
          />
        );
      })}
    </View>
  );
}

// ─── Summary Step ────────────────────────────────────────────────────────────

interface SummaryStepProps {
  steps: SnapshotStep[];
  allChoices: SnapshotChoice[];
  selections: ConfiguratorSelections;
  colourSelections: ColourSelections;
  lensColours: LensColour[];
  priceSummary: ConfiguratorPriceSummary;
  onGoToStep: (idx: number) => void;
}

function SummaryStep({
  steps,
  allChoices,
  selections,
  colourSelections,
  lensColours,
  priceSummary,
  onGoToStep,
}: SummaryStepProps) {
  const choiceMap = new Map(allChoices.map((c) => [c.id, c]));
  const colourMap = new Map(lensColours.map((c) => [c.id, c]));

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text className="text-displayMd text-text-primary mb-xl">Review your selection</Text>

      {steps.map((step, stepIdx) => (
        <View key={step.id} className="mb-lg">
          <View className="flex-row items-center justify-between mb-sm">
            <Text className="text-headline text-text-primary">{step.name?.en}</Text>
            <Pressable onPress={() => onGoToStep(stepIdx)} className="min-h-[44px] justify-center px-sm">
              <Text className="text-body text-navy">Edit</Text>
            </Pressable>
          </View>

          {step.groups.map((group) => {
            const selectedIds = selections[group.id] ?? [];
            if (!selectedIds.length) return null;
            return (
              <View key={group.id} className="mb-sm">
                <Text className="text-caption text-text-muted">{group.label?.en}</Text>
                {selectedIds.map((choiceId) => {
                  const choice = choiceMap.get(choiceId);
                  if (!choice) return null;
                  const colourKey = `${group.id}:${choiceId}:colour`;
                  const selectedColourId = colourSelections[colourKey];
                  const colour = selectedColourId ? colourMap.get(selectedColourId) : null;
                  return (
                    <Text key={choiceId} className="text-body text-text-primary">
                      {choice.label?.en ?? choice.code}
                      {colour && ` — ${colour.label}`}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>
      ))}

      {/* Price breakdown */}
      <View className="bg-bg-surface rounded-lg border border-border p-lg mt-md">
        <Text className="text-headline text-text-primary mb-md">Price breakdown</Text>
        {priceSummary.basePrice > 0 && (
          <View className="flex-row justify-between py-xs">
            <Text className="text-body text-text-primary">Frame</Text>
            <Text className="text-body text-text-primary">
              ${(priceSummary.basePrice / 100).toFixed(2)}
            </Text>
          </View>
        )}
        {priceSummary.pricingLines.map((line) => (
          <View key={line.code} className="flex-row justify-between py-xs">
            <Text className="text-body text-text-muted">{line.label}</Text>
            <Text className="text-body text-text-primary">
              +${(line.amount / 100).toFixed(2)}
            </Text>
          </View>
        ))}
        <View className="flex-row justify-between pt-md border-t border-border mt-md">
          <Text className="text-headline text-text-primary">Total</Text>
          <Text className="text-headline text-text-primary">
            ${(priceSummary.total / 100).toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── ConfiguratorSheet (main) ────────────────────────────────────────────────

export interface ConfiguratorSheetProps {
  visible: boolean;
  productId: string;
  productName: string;
  variantId?: string;
  basePrice?: number; // cents
  onClose: () => void;
  onComplete: (cartResult: CartResult, priceSummary: ConfiguratorPriceSummary) => void;
}

export function ConfiguratorSheet({
  visible,
  productId,
  productName,
  variantId,
  basePrice = 0,
  onClose,
  onComplete,
}: ConfiguratorSheetProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selections, setSelections] = useState<ConfiguratorSelections>({});
  const [colourSelections, setColourSelections] = useState<ColourSelections>({});

  // Resolve which flow applies
  const { data: resolveData, isLoading: resolving } = useConfiguratorResolve(
    visible ? productId : null
  );
  const firstChannel = resolveData?.channels?.[0];

  // Load the snapshot
  const { data: snapshot, isLoading: loadingSnapshot } = useConfiguratorSnapshot(
    firstChannel?.flowId ?? null
  );

  // Lens colours reference data
  const { data: lensColoursRaw = [] } = useLensColours();

  const isLoading = resolving || loadingSnapshot;
  const hasConfigurator = !!snapshot && (snapshot.steps?.length ?? 0) > 0;

  // Flatten all choices and groups from snapshot
  const allChoices = useMemo(
    () => snapshot?.steps.flatMap((s) => s.groups.flatMap((g) => g.choices)) ?? [],
    [snapshot]
  );

  const allGroups = useMemo(
    () => snapshot?.steps.flatMap((s) => s.groups) ?? [],
    [snapshot]
  );

  // Build price rule lookup: choiceId → amount
  const priceRuleMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const rule of snapshot?.priceRules ?? []) {
      if (rule.amount) map.set(rule.ownerId, rule.amount);
    }
    return map;
  }, [snapshot]);

  // Build lens colours by set
  const lensColoursBySet = useMemo(() => {
    const map = new Map<string, LensColour[]>();
    for (const colour of lensColoursRaw) {
      const existing = map.get(colour.setName) ?? [];
      map.set(colour.setName, [...existing, colour]);
    }
    return map;
  }, [lensColoursRaw]);

  // Summary step is the last virtual step
  const steps = snapshot?.steps ?? [];
  const isSummaryStep = currentStepIdx === steps.length;
  const currentStep: SnapshotStep | null = steps[currentStepIdx] ?? null;

  // Check if current step is complete
  const currentStepComplete = useMemo(() => {
    if (!currentStep) return true;
    return isStepComplete(currentStep.groups, selections);
  }, [currentStep, selections]);

  // Compute running price delta
  const priceDelta = useMemo(
    () => computePriceDelta(selections, allChoices, snapshot?.priceRules ?? [], lensColoursRaw, colourSelections),
    [selections, allChoices, snapshot, lensColoursRaw, colourSelections]
  );

  const priceSummary: ConfiguratorPriceSummary = useMemo(() => {
    const cartResult = snapshot
      ? serializeSelections(selections, allGroups, allChoices, snapshot.priceRules ?? [], lensColoursRaw, colourSelections)
      : { attributes: [], addonLines: [], pricingLines: [] };
    return {
      basePrice,
      addons: priceDelta,
      total: basePrice + priceDelta,
      pricingLines: cartResult.pricingLines,
    };
  }, [selections, allGroups, allChoices, snapshot, lensColoursRaw, colourSelections, basePrice, priceDelta]);

  // ─── Selection handlers ───────────────────────────────────────────────────

  const handleToggleChoice = useCallback(
    (groupId: string, choiceId: string, selectionType: 'single' | 'multiple') => {
      setSelections((prev) => {
        const existing = prev[groupId] ?? [];
        if (selectionType === 'single') {
          // Deselect if already selected, else replace
          return {
            ...prev,
            [groupId]: existing.includes(choiceId) ? [] : [choiceId],
          };
        } else {
          // Toggle in multi-select
          return {
            ...prev,
            [groupId]: existing.includes(choiceId)
              ? existing.filter((id) => id !== choiceId)
              : [...existing, choiceId],
          };
        }
      });
    },
    []
  );

  const handleSelectColour = useCallback((compositeKey: string, colourId: string) => {
    setColourSelections((prev) => ({ ...prev, [compositeKey]: colourId }));
  }, []);

  // ─── Navigation ───────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (currentStepIdx < steps.length) {
      setCurrentStepIdx((i) => i + 1);
    }
  }, [currentStepIdx, steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStepIdx((i) => Math.max(0, i - 1));
  }, []);

  const handleGoToStep = useCallback((idx: number) => {
    setCurrentStepIdx(idx);
  }, []);

  const handleComplete = useCallback(() => {
    if (!snapshot) return;
    const cartResult = serializeSelections(
      selections,
      allGroups,
      allChoices,
      snapshot.priceRules ?? [],
      lensColoursRaw,
      colourSelections
    );
    onComplete(cartResult, priceSummary);
  }, [snapshot, selections, allGroups, allChoices, lensColoursRaw, colourSelections, priceSummary, onComplete]);

  const handleClose = useCallback(() => {
    // Reset state on close
    setCurrentStepIdx(0);
    setSelections({});
    setColourSelections({});
    onClose();
  }, [onClose]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-bg-page">
        {/* Top bar */}
        <View className="flex-row items-center px-xl pt-xl pb-md border-b border-border">
          <View className="flex-1">
            <Text className="text-caption text-text-muted">Configure lenses for</Text>
            <Text className="text-headline text-text-primary" numberOfLines={1}>
              {productName}
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            className="w-[44px] h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close configurator"
          >
            <X size={24} color="#2B2B2B" />
          </Pressable>
        </View>

        {/* Loading */}
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0A153D" />
            <Text className="text-body text-text-muted mt-md">Loading lens options…</Text>
          </View>
        )}

        {/* No configurator for this product */}
        {!isLoading && !hasConfigurator && (
          <View className="flex-1 items-center justify-center p-xl">
            <Text className="text-headline text-text-primary text-center mb-md">
              No lens options available
            </Text>
            <Text className="text-body text-text-muted text-center mb-xl">
              This frame doesn't have a lens configuration. It can be ordered as-is.
            </Text>
            <Button variant="secondary" onPress={handleClose}>Close</Button>
          </View>
        )}

        {/* Configurator flow */}
        {!isLoading && hasConfigurator && (
          <>
            {/* Progress bar */}
            <View className="px-xl pt-md pb-sm">
              <View className="flex-row items-center gap-xs">
                {steps.map((step, idx) => (
                  <Pressable
                    key={step.id}
                    onPress={() => idx < currentStepIdx ? handleGoToStep(idx) : undefined}
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    accessibilityRole="progressbar"
                    accessibilityLabel={`Step ${idx + 1}: ${step.name?.en}`}
                  >
                    <View
                      className={`h-full rounded-full ${
                        idx < currentStepIdx
                          ? 'bg-green'
                          : idx === currentStepIdx
                          ? 'bg-navy'
                          : 'bg-warmGrey'
                      }`}
                    />
                  </Pressable>
                ))}
                {/* Summary dot */}
                <View className={`w-3 h-3 rounded-full ${isSummaryStep ? 'bg-green' : 'bg-warmGrey'}`} />
              </View>
              <Text className="text-caption text-text-muted mt-xs">
                {isSummaryStep
                  ? 'Summary'
                  : `Step ${currentStepIdx + 1} of ${steps.length}: ${currentStep?.name?.en}`}
              </Text>
            </View>

            {/* Running price */}
            {priceDelta > 0 && (
              <View className="px-xl pb-sm">
                <Text className="text-caption text-text-muted">
                  Lens options: <Text className="text-bodyStrong text-text-primary">+${(priceDelta / 100).toFixed(2)}</Text>
                </Text>
              </View>
            )}

            {/* Step content */}
            <ScrollView className="flex-1 px-xl" showsVerticalScrollIndicator={false}>
              {isSummaryStep ? (
                <SummaryStep
                  steps={steps}
                  allChoices={allChoices}
                  selections={selections}
                  colourSelections={colourSelections}
                  lensColours={lensColoursRaw}
                  priceSummary={priceSummary}
                  onGoToStep={handleGoToStep}
                />
              ) : (
                <View className="pt-md pb-2xl">
                  {currentStep?.description?.en && (
                    <Text className="text-body text-text-muted mb-lg">
                      {currentStep.description.en}
                    </Text>
                  )}
                  {currentStep?.groups.map((group) => (
                    <GroupSection
                      key={group.id}
                      group={group}
                      choices={allChoices.filter((c) => c.groupId === group.id)}
                      selections={selections}
                      colourSelections={colourSelections}
                      priceRuleMap={priceRuleMap}
                      lensColoursBySet={lensColoursBySet}
                      onToggleChoice={handleToggleChoice}
                      onSelectColour={handleSelectColour}
                    />
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Bottom navigation */}
            <View className="flex-row items-center px-xl py-md border-t border-border gap-md bg-bg-elevated">
              {currentStepIdx > 0 && (
                <Pressable
                  onPress={handleBack}
                  className="min-h-[44px] min-w-[44px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ChevronLeft size={24} color="#2B2B2B" />
                </Pressable>
              )}

              <View className="flex-1">
                {isSummaryStep ? (
                  <Button variant="primary" onPress={handleComplete}>
                    Confirm configuration
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onPress={handleNext}
                    disabled={!currentStepComplete}
                  >
                    <View className="flex-row items-center gap-xs justify-center">
                      <Text className="text-text-inverse text-bodyStrong">
                        {currentStepIdx === steps.length - 1 ? 'Review' : 'Next'}
                      </Text>
                      <ChevronRight size={18} color="white" />
                    </View>
                  </Button>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
