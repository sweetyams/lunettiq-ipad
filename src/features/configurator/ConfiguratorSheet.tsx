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
 * Design: kit Sheet, step chips, choice rows with a near-black selection ring,
 * running total beside the one primary.
 */
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Image } from 'expo-image';
import { ChevronRight, ChevronLeft, Check, ExternalLink } from 'lucide-react-native';
import {
  useConfiguratorResolve,
  useConfiguratorSnapshot,
  useLensColours,
  serializeSelections,
  computePriceDelta,
} from '@/src/api/useConfigurator';
import { visibleSteps, isSelectable, stepComplete, pruneSelections, defaultSelections, t } from './flow';
import { Badge, Button, KeyValue, Section, Sheet, kitColors } from '@/src/ui/kit';
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
import { resolveLensColourLabel } from '@/src/api/configurator.types';

// ─── Choice Card ────────────────────────────────────────────────────────────

interface ChoiceCardProps {
  choice: SnapshotChoice;
  isSelected: boolean;
  onPress: () => void;
  priceDelta: number; // cents
}

function ChoiceCard({ choice, isSelected, onPress, priceDelta }: ChoiceCardProps) {
  const label = choice.label?.en ?? choice.code;
  const description = choice.description?.en || t(choice.helpText);
  const price = priceDelta > 0 ? `+$${(priceDelta / 100).toFixed(2)}` : 'Included';
  const badge = t(choice.badge);

  if (choice.comingSoon) {
    // Shown as on the web, not orderable yet.
    return (
      <View className="mb-[8px] min-h-[56px] rounded-lg px-[16px] py-[12px] flex-row items-center gap-[14px] border border-border" style={{ margin: 1, opacity: 0.55 }} accessible accessibilityLabel={`${label}, coming soon`}>
        <View className="w-[22px] h-[22px] rounded-full border border-border" />
        <Text className="flex-1 text-body-md text-text-secondary">{label}</Text>
        <Badge>Coming soon</Badge>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${label}, ${price}`}
      className="mb-[8px]"
    >
      {({ pressed }) => (
        <View
          className={`min-h-[56px] rounded-lg px-[16px] py-[12px] flex-row items-center gap-[14px] ${isSelected ? 'border-2 border-accent' : `border ${pressed ? 'border-text-tertiary' : 'border-border'}`}`}
          style={isSelected ? undefined : { margin: 1 }}
        >
          <View className={`w-[22px] h-[22px] rounded-full items-center justify-center ${isSelected ? 'bg-accent' : 'border border-border'}`}>
            {isSelected ? <Check size={14} color={kitColors.inverse} strokeWidth={3} /> : null}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-[8px]">
              <Text className={`text-body-md text-text-primary ${isSelected ? 'font-medium' : ''}`}>{label}</Text>
              {badge ? <Badge tone="info">{badge}</Badge> : null}
            </View>
            {description ? <Text className="text-body-sm text-text-tertiary mt-[2px]">{description}</Text> : null}
          </View>
          <Text className={`text-body-sm ${priceDelta > 0 ? 'font-medium text-text-primary' : 'text-text-tertiary'}`} style={{ fontVariant: ['tabular-nums'] }}>{price}</Text>
        </View>
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
  const displayLabel = resolveLensColourLabel(colour.label);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${displayLabel}, ${priceLabel}`}
      className="items-center w-[72px] gap-[4px]"
    >
      <View className={`w-[52px] h-[52px] rounded-full items-center justify-center ${isSelected ? 'border-2 border-accent' : 'border border-border'}`}>
        {/* Swatch colour is product data (the lens tint), not a UI colour. A fade shows both ends. */}
        {colour.imageUrl ? (
          <Image source={{ uri: colour.imageUrl }} contentFit="cover" style={{ width: 42, height: 42, borderRadius: 21 }} accessibilityIgnoresInvertColors />
        ) : (
          <View className="w-[42px] h-[42px] rounded-full overflow-hidden">
            <View style={{ flex: 1, backgroundColor: colour.hexStart }} />
            {colour.hexEnd ? <View style={{ flex: 1, backgroundColor: colour.hexEnd }} /> : null}
          </View>
        )}
      </View>
      <Text className="text-body-sm text-text-primary text-center" numberOfLines={2}>{displayLabel}</Text>
      <Text className="text-body-sm text-text-tertiary">{priceLabel}</Text>
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
    <View className="mb-[24px]">
      <View className="flex-row items-center gap-[8px] mb-[10px]">
        {t(group.label) ? <Text className="text-heading-lg text-text-primary">{t(group.label)}</Text> : null}
        {!groupChoices.some(isSelectable) ? null : group.isRequired ? <Badge>Required</Badge> : <Text className="text-body-sm text-text-tertiary">Optional</Text>}
      </View>

      {groupChoices.map((choice) => {
        const isSelected = selectedIds.includes(choice.id);
        const priceDelta = priceRuleMap.get(choice.id) ?? choice.priceDelta ?? 0;

        if (choice.choiceType === 'content') {
          const body = t(choice.contentBody) || t(choice.description);
          return body ? <Text key={choice.id} className="text-body-sm text-text-secondary mb-[10px]">{body}</Text> : null;
        }
        if (choice.choiceType === 'link') {
          const url = typeof choice.link === 'string' ? choice.link : choice.link?.url;
          return (
            <Pressable key={choice.id} onPress={url ? () => { Linking.openURL(url).catch(() => {}); } : undefined} disabled={!url} accessibilityRole="link" accessibilityLabel={choice.label?.en ?? choice.code} className="flex-row items-center gap-[6px] min-h-[44px] mb-[8px]">
              <Text className="text-body-md font-medium text-text-primary underline">{choice.label?.en ?? choice.code}</Text>
              {url ? <ExternalLink size={16} color={kitColors.textTertiary} /> : null}
            </Pressable>
          );
        }
        if (choice.choiceType === 'input') return null;

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
                <View className="ml-[36px] mb-[12px]">
                  <Text className="text-body-sm text-text-tertiary mb-[8px]">Tint</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 8 }}>
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

  const money = (c: number) => `$${(c / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (
    <View className="gap-[16px]">
      {steps.map((step, stepIdx) => (
        <Section key={step.id} title={step.name?.en ?? `Step ${stepIdx + 1}`} action={{ label: 'Change', onPress: () => onGoToStep(stepIdx) }}>
          <KeyValue
            rows={step.groups.map((group) => {
              const ids = selections[group.id] ?? [];
              const labels = ids.map((cid) => {
                const choice = choiceMap.get(cid);
                const colour = colourMap.get(colourSelections[`${group.id}:${cid}:colour`] ?? '');
                return `${choice?.label?.en ?? choice?.code ?? ''}${colour ? ` · ${resolveLensColourLabel(colour.label)}` : ''}`;
              });
              return { label: group.label?.en ?? group.code, value: labels.join(', ') || null };
            })}
          />
        </Section>
      ))}
      <Section title="Price">
        <KeyValue
          mono
          rows={[
            ...(priceSummary.basePrice > 0 ? [{ label: 'Frame', value: money(priceSummary.basePrice) }] : []),
            ...priceSummary.pricingLines.map((l) => ({ label: l.label, value: `+${money(l.amount)}` })),
            { label: 'Total', value: <Text className="text-heading-lg text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{money(priceSummary.total)}</Text> },
          ]}
        />
      </Section>
    </View>
  );
}

// ─── ConfiguratorSheet (main) ────────────────────────────────────────────────

export interface ConfiguratorSheetProps {
  visible: boolean;
  productId: string;
  productName: string;
  variantId?: string;
  basePrice?: number; // cents
  /** The last button. Defaults to "Continue to order". */
  completeLabel?: string;
  onClose: () => void;
  onComplete: (cartResult: CartResult, priceSummary: ConfiguratorPriceSummary) => void;
}

export function ConfiguratorSheet({
  visible,
  productId,
  productName,
  variantId,
  basePrice = 0,
  completeLabel = 'Continue to order',
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

  // Pre-pick defaults once the flow loads (the only orderable lens type, say).
  useEffect(() => {
    if (snapshot && Object.keys(selections).length === 0) setSelections(pruneSelections(snapshot, defaultSelections(snapshot)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  // Summary step is the last virtual step. Only the steps the picks so far make visible.
  const steps = useMemo(() => (snapshot ? visibleSteps(snapshot, selections) : []), [snapshot, selections]);
  const isSummaryStep = currentStepIdx === steps.length;
  const currentStep: SnapshotStep | null = steps[currentStepIdx] ?? null;

  // Check if current step is complete
  const currentStepComplete = useMemo(() => {
    if (!currentStep) return true;
    return stepComplete(currentStep, selections);
  }, [currentStep, selections]);

  // Jumping between steps means the summary must check every step, not just the last one.
  const firstIncomplete = useMemo(() => steps.findIndex((st) => !stepComplete(st, selections)), [steps, selections]);
  const allRequiredDone = firstIncomplete === -1;

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
        const next = selectionType === 'single'
          ? { ...prev, [groupId]: existing.includes(choiceId) ? [] : [choiceId] }
          : { ...prev, [groupId]: existing.includes(choiceId) ? existing.filter((id) => id !== choiceId) : [...existing, choiceId] };
        // A change can hide later steps or choices: drop picks that are no longer shown.
        return snapshot ? pruneSelections(snapshot, next) : next;
      });
    },
    [snapshot]
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

  const money = (c: number) => `$${(c / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const total = basePrice + priceDelta;
  const frameOnly = () => onComplete({ attributes: [], addonLines: [], pricingLines: [] } as unknown as CartResult, { basePrice, addons: 0, total: basePrice, pricingLines: [] });

  const footer = isLoading ? undefined : !hasConfigurator ? (
    <View className="flex-1 flex-row justify-end gap-[8px]">
      <Button label="Cancel" variant="ghost" onPress={handleClose} />
      {completeLabel === 'Done' ? null : <Button label="Order frame only" variant="primary" onPress={frameOnly} />}
    </View>
  ) : (
    <View className="flex-1 flex-row items-center gap-[8px]">
      {currentStepIdx > 0 ? <Button label="Back" icon={ChevronLeft} variant="ghost" onPress={handleBack} /> : <Button label="Cancel" variant="ghost" onPress={handleClose} />}
      <View className="flex-1 items-end pr-[8px]">
        <Text className="text-body-sm text-text-tertiary">{basePrice > 0 ? 'Total' : 'Lens options'}</Text>
        <Text className="text-heading-lg text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{money(basePrice > 0 ? total : priceDelta)}</Text>
      </View>
      {isSummaryStep ? (
        <Button label={allRequiredDone ? completeLabel : 'Finish the lens steps'} variant="primary" onPress={allRequiredDone ? handleComplete : () => handleGoToStep(firstIncomplete)} />
      ) : (
        <Button label={currentStepIdx === steps.length - 1 ? 'Review' : 'Next'} icon={ChevronRight} variant="primary" onPress={handleNext} disabled={!currentStepComplete} />
      )}
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      wide
      title={`Lenses · ${productName}`}
      subtitle={isLoading ? 'Loading lens options…' : !hasConfigurator ? undefined : isSummaryStep ? 'Review before ordering' : `Step ${currentStepIdx + 1} of ${steps.length}`}
      footer={footer}
    >
      {isLoading ? (
        <View className="py-[48px] items-center"><ActivityIndicator color={kitColors.primary} /></View>
      ) : !hasConfigurator ? (
        <Text className="text-body-md text-text-secondary">{completeLabel === 'Done' ? 'This store has no lens options set up for this frame yet.' : 'This frame has no lens options set up. You can order the frame on its own.'}</Text>
      ) : (
        <View className="gap-[20px]">
          <View className="flex-row flex-wrap gap-[8px]">
            {/* Every step is reachable at any time (add-ons used to be greyed out until the
                lens steps were done). A tick means the step has what it needs. */}
            {[...steps.map((st) => st.name?.en ?? 'Step'), 'Review'].map((name, idx) => {
              const step = steps[idx];
              const done = step ? stepComplete(step, selections) && Object.keys(selections).some((g) => step.groups.some((gr) => gr.id === g && (selections[g]?.length ?? 0) > 0)) : false;
              const on = idx === currentStepIdx;
              return (
                <Pressable key={`${name}-${idx}`} onPress={() => handleGoToStep(idx)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={`${name}${done ? ', done' : ''}`}>
                  <View className={`flex-row items-center gap-[6px] rounded-full px-[14px] min-h-[44px] border ${on ? 'bg-accent border-accent' : 'bg-bg-page border-border'}`}>
                    {done && !on ? <Check size={14} color={kitColors.text} /> : <Text className={`text-body-sm ${on ? 'text-accent-text' : 'text-text-tertiary'}`}>{idx + 1}</Text>}
                    <Text className={`text-body-sm font-medium ${on ? 'text-accent-text' : 'text-text-primary'}`}>{name}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {isSummaryStep ? (
            <SummaryStep steps={steps} allChoices={allChoices} selections={selections} colourSelections={colourSelections} lensColours={lensColoursRaw} priceSummary={priceSummary} onGoToStep={handleGoToStep} />
          ) : (
            <View>
              {currentStep?.description?.en ? <Text className="text-body-md text-text-secondary mb-[16px]">{currentStep.description.en}</Text> : null}
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
        </View>
      )}
    </Sheet>
  );
}
