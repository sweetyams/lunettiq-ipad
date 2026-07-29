import { View, Text, Pressable } from 'react-native';
import { Card, RowKV, Chip, Tag, Button } from '@/src/ui';
import { useClientEnrichment, useClientPreferences, useClientWishlist, useClientSegments } from '@/src/api/useClients';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import type { ClientProfile, StatedPreferences, WishlistItem, ClientSegment } from '@/src/api/clients.types';

export interface OverviewTabProps {
  clientId: string;
  client: ClientProfile;
  onOpenSheet: (sheet: 'insurance' | 'lifestyle' | 'multipair' | 'prescription' | 'preferences') => void;
  onEditSection: (section: 'contact' | 'notes') => void;
}

export function OverviewTab({ clientId, client, onOpenSheet, onEditSection }: OverviewTabProps) {
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { data: preferences } = useClientPreferences(clientId);
  const { data: wishlist } = useClientWishlist(clientId);
  const { data: segments } = useClientSegments(clientId);
  
  const EmptyState = ({ children }: { children: React.ReactNode }) => (
    <View className="bg-color-bg-muted rounded-sm p-md">
      <Text className="text-body-sm text-color-text-muted">{children}</Text>
    </View>
  );

  const renderPreferences = () => {
    if (!preferences) {
      return <EmptyState>No preferences set</EmptyState>;
    }

    const { shapes = [], colours = [], avoid = [] } = preferences?.stated || {};

    return (
      <View>
        {shapes.length > 0 && (
          <View className="mb-md">
            <Text className="text-caption-md tracking-widest uppercase text-color-text-muted mb-sm">Shapes</Text>
            <View className="flex-row flex-wrap gap-[6px]">
              {shapes.map((shape: string) => (
                <Chip key={shape} label={shape} variant="on" />
              ))}
            </View>
          </View>
        )}
        
        {colours.length > 0 && (
          <View className="mb-md">
            <Text className="text-caption-md tracking-widest uppercase text-color-text-muted mb-sm">Colours</Text>
            <View className="flex-row flex-wrap gap-[6px]">
              {colours.map((colour: string) => (
                <Chip key={colour} label={colour} variant="on" />
              ))}
            </View>
          </View>
        )}
        
        {avoid.length > 0 && (
          <View>
            <Text className="text-caption-md tracking-widest uppercase text-color-text-muted mb-sm">Avoid</Text>
            <View className="flex-row flex-wrap gap-[6px]">
              {avoid.map((item: string) => (
                <Chip key={item} label={item} variant="neg" />
              ))}
            </View>
          </View>
        )}
        
        {shapes.length === 0 && colours.length === 0 && avoid.length === 0 && (
          <EmptyState>No preferences set</EmptyState>
        )}
      </View>
    );
  };

  const renderWishlist = () => {
    if (!wishlist || wishlist.length === 0) {
      return <EmptyState>No items in wishlist</EmptyState>;
    }

    return (
      <View className="flex-row flex-wrap gap-sm">
        {wishlist.slice(0, 6).map((item: WishlistItem) => (
          <View key={item.id} className="w-16 h-16 bg-color-bg-muted rounded-sm" />
        ))}
      </View>
    );
  };

  const renderTagsAndSegments = () => {
    const tags = client.tags || [];
    const hasContent = tags.length > 0 || (segments && segments.length > 0);

    if (!hasContent) {
      return <EmptyState>No tags or segments</EmptyState>;
    }

    return (
      <View>
        {tags.length > 0 && (
          <View className="mb-md">
            <View className="flex-row flex-wrap gap-[6px]">
              {tags.map((tag: string) => (
                <Chip key={tag} label={tag} variant="default" />
              ))}
            </View>
          </View>
        )}
        
        {segments && segments.length > 0 && (
          <View>
            {segments.map((segment: ClientSegment) => (
              <Text key={segment.id} className="text-body-sm text-color-text-secondary mb-xs">
                {segment.name.en}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMultiPairSuggestions = () => {
    // Mock readiness state - in real implementation this would come from API
    const hasLifestyleProfile = false;
    const hasInsurance = false;
    const hasPreferences = preferences && (preferences.stated?.shapes?.length > 0 || preferences.stated?.colours?.length > 0);

    const readinessTags = [];
    if (!hasLifestyleProfile) readinessTags.push({ label: 'Lifestyle profile missing', variant: 'warn' as const });
    if (!hasInsurance) readinessTags.push({ label: 'Insurance info missing', variant: 'warn' as const });
    if (!hasPreferences) readinessTags.push({ label: 'Preferences missing', variant: 'warn' as const });

    return (
      <View>
        {readinessTags.length > 0 ? (
          <View>
            <View className="flex-row flex-wrap gap-[6px] mb-md">
              {readinessTags.map((tag: { label: string; variant: 'warn' }) => (
                <Tag key={tag.label} label={tag.label} variant={tag.variant} />
              ))}
            </View>
            <Text className="text-body-sm text-color-text-muted mb-md">
              Complete the missing sections to generate personalized multi-pair recommendations.
            </Text>
            <Button variant="quiet" size="sm" disabled onPress={() => {}}>
              <Text className="text-body-sm font-medium text-color-text-muted">Generate recommendations</Text>
            </Button>
          </View>
        ) : (
          <View>
            <Text className="text-body-sm text-color-text-secondary mb-md">
              All requirements met for personalized recommendations.
            </Text>
            <Button variant="primary" size="sm" onPress={() => onOpenSheet('multipair')}>
              <Text className="text-body-sm font-medium text-color-brand-text">Generate recommendations</Text>
            </Button>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-row gap-lg">
      {/* Left Column */}
      <View className="flex-1 gap-lg">
        {/* Contact */}
        <Card>
          <Card.Head>
            <Text className="text-heading-xs font-medium text-color-text-primary">Contact</Text>
            <Pressable onPress={() => onEditSection('contact')} hitSlop={8}>
              <Text className="text-body-sm font-medium text-color-brand">Edit</Text>
            </Pressable>
          </Card.Head>
          <Card.Body>
            <RowKV label="First name" value={client.firstName} />
            <RowKV label="Last name" value={client.lastName} />
            <RowKV label="Email" value={client.email} />
            <RowKV label="Phone" value={client.phone} isLast />
          </Card.Body>
        </Card>

        {/* Preferences */}
        <Card>
          <Card.Head>
            <Text className="text-heading-xs font-medium text-color-text-primary">Preferences</Text>
            <Pressable onPress={() => onOpenSheet('preferences')} hitSlop={8}>
              <Text className="text-body-sm font-medium text-color-brand">Edit</Text>
            </Pressable>
          </Card.Head>
          <Card.Body>
            {renderPreferences()}
          </Card.Body>
        </Card>

        {/* Wishlist */}
        <Card>
          <Card.Head>
            <Text className="text-heading-xs font-medium text-color-text-primary">
              Wishlist · {wishlist?.length || 0}
            </Text>
            <Pressable hitSlop={8}>
              <Text className="text-body-sm font-medium text-color-brand">See all</Text>
            </Pressable>
          </Card.Head>
          <Card.Body>
            {renderWishlist()}
          </Card.Body>
        </Card>

        {/* Tags and segments */}
        <Card>
          <Card.Head>
            <Text className="text-heading-xs font-medium text-color-text-primary">Tags and segments</Text>
            <Pressable hitSlop={8}>
              <Text className="text-body-sm font-medium text-color-brand">Manage</Text>
            </Pressable>
          </Card.Head>
          <Card.Body>
            {renderTagsAndSegments()}
          </Card.Body>
        </Card>
      </View>

      {/* Right Column */}
      <View className="flex-1 gap-lg">
        {/* Insurance */}
        <Card>
          <Card.Head>
            <Text className="text-heading-xs font-medium text-color-text-primary">Insurance</Text>
            <Pressable onPress={() => onOpenSheet('insurance')} hitSlop={8}>
              <Text className="text-body-sm font-medium text-color-brand">Add</Text>
            </Pressable>
          </Card.Head>
          <Card.Body>
            <EmptyState>No insurance information on file</EmptyState>
          </Card.Body>
        </Card>

        {/* Lifestyle */}
        <Card>
          <Card.Head>
            <Text className="text-heading-xs font-medium text-color-text-primary">Lifestyle</Text>
            <Pressable onPress={() => onOpenSheet('lifestyle')} hitSlop={8}>
              <Text className="text-body-sm font-medium text-color-brand">Fill — 2 min</Text>
            </Pressable>
          </Card.Head>
          <Card.Body>
            <EmptyState>Complete lifestyle questionnaire for better recommendations</EmptyState>
          </Card.Body>
        </Card>

        {/* Multi-pair suggestions */}
        <Card>
          <Card.Head>
            <Text className="text-heading-xs font-medium text-color-text-primary">Multi-pair suggestions</Text>
          </Card.Head>
          <Card.Body>
            {renderMultiPairSuggestions()}
          </Card.Body>
        </Card>

        {/* Upcoming */}
        <Card>
          <Card.Head>
            <Text className="text-heading-xs font-medium text-color-text-primary">Upcoming</Text>
            <Pressable hitSlop={8}>
              <Text className="text-body-sm font-medium text-color-brand">Book</Text>
            </Pressable>
          </Card.Head>
          <Card.Body>
            <EmptyState>No upcoming appointments</EmptyState>
          </Card.Body>
        </Card>

        {/* Internal notes - staff only */}
        {privacyMode === 'staff' && (
          <Card>
            <Card.Head>
              <Text className="text-heading-xs font-medium text-color-text-primary">Internal notes</Text>
              <Pressable onPress={() => onEditSection('notes')} hitSlop={8}>
                <Text className="text-body-sm font-medium text-color-brand">Add</Text>
              </Pressable>
            </Card.Head>
            <Card.Body>
              <EmptyState>No internal notes</EmptyState>
            </Card.Body>
          </Card>
        )}
      </View>
    </View>
  );
}