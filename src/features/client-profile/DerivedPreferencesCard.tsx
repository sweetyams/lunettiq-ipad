import { View, Text } from 'react-native';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react-native';
import type { DerivedPreferences } from '@/src/api/clients.types';

interface DerivedPreferencesCardProps {
  derived: DerivedPreferences;
}

export function DerivedPreferencesCard({ derived }: DerivedPreferencesCardProps) {
  return (
    <View className="mt-lg pt-lg border-t border-border">
      <View className="flex-row items-center mb-md">
        <TrendingUp color="#6B6B6B" size={18} />
        <Text className="text-heading-sm text-text-primary font-semibold ml-sm">
          Derived Preferences
        </Text>
      </View>

      <View className="gap-md">
        {/* Shapes */}
        {Object.keys(derived.derivedShapes).length > 0 && (
          <PreferenceCategory
            label="Shapes"
            data={derived.derivedShapes}
          />
        )}

        {/* Materials */}
        {Object.keys(derived.derivedMaterials).length > 0 && (
          <PreferenceCategory
            label="Materials"
            data={derived.derivedMaterials}
          />
        )}

        {/* Colours */}
        {Object.keys(derived.derivedColours).length > 0 && (
          <PreferenceCategory
            label="Colours"
            data={derived.derivedColours}
          />
        )}

        {/* Price Range */}
        {derived.derivedPriceRange && (
          <View className="flex-row items-center">
            <Text className="text-body-md text-text-muted w-20">Price</Text>
            <View className="flex-1 flex-row items-center">
              <DollarSign color="#6B6B6B" size={16} />
              <Text className="text-body-md text-text-primary ml-xs">
                ${derived.derivedPriceRange.min} – ${derived.derivedPriceRange.max}
              </Text>
              <Text className="text-body-sm text-text-muted ml-sm">
                (avg ${derived.derivedPriceRange.avg})
              </Text>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View className="flex-row items-center mt-sm pt-sm border-t border-border/50">
          <Calendar color="#6B6B6B" size={14} />
          <Text className="text-caption-md text-text-muted ml-xs">
            Based on {derived.sourceOrderCount} order{derived.sourceOrderCount !== 1 ? 's' : ''}
            {derived.lastComputedAt && (
              <Text>
                {' '}· Updated {new Date(derived.lastComputedAt).toLocaleDateString()}
              </Text>
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

interface PreferenceCategoryProps {
  label: string;
  data: Record<string, number>;
}

function PreferenceCategory({ label, data }: PreferenceCategoryProps) {
  // Sort by score descending, show top 8
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  if (sorted.length === 0) return null;

  return (
    <View className="flex-row items-start">
      <Text className="text-body-md text-text-muted w-20">{label}</Text>
      <View className="flex-1 flex-row flex-wrap gap-xs">
        {sorted.map(([name, score]) => {
          // Calculate opacity based on score (0.1 to 1.0 range)
          const opacity = Math.max(0.15, Math.min(1.0, score));
          const percentage = Math.round(score * 100);
          
          // Determine font weight based on score
          const fontWeight = score > 0.7 ? 'font-semibold' : score > 0.4 ? 'font-medium' : 'font-normal';
          
          return (
            <View
              key={name}
              style={{ opacity: 0.4 + (opacity * 0.6) }}
              className={`px-sm py-xs rounded-md bg-bg-muted`}
            >
              <View className="flex-row items-center gap-xs">
                <Text className={`text-caption-md text-text-primary ${fontWeight}`}>
                  {name}
                </Text>
                <Text className="text-caption-sm text-text-muted">
                  {percentage}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}