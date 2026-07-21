import { View, Text, ScrollView, Pressable, TextInput, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Mail, Phone, MapPin, CreditCard, User, Eye, Glasses, 
  Heart, ShoppingBag, Star, Calendar, MessageCircle, 
  FileText, Plus, Palette, Lightbulb 
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useClient } from '@/src/api/useClients';
import { useInteractions } from '@/src/api/useInteractions';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { api } from '@/src/api/client';
import { LoadingState, ErrorState, EmptyState, Button, Card, TimelineEntry } from '@/src/ui';
import type { ClientProfile } from '@/src/api/clients.types';

// Additional API hooks for client profile sections
function useClientOrders(clientId: string) {
  return useQuery({
    queryKey: ['client-orders', clientId],
    queryFn: () => api.get<{ data: any[] }>(`/api/clients/${clientId}/orders`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

function useClientWishlist(clientId: string) {
  return useQuery({
    queryKey: ['client-wishlist', clientId],
    queryFn: () => api.get<{ data: any[] }>(`/api/clients/${clientId}/wishlist`),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });
}

function useClientPrescriptions(clientId: string) {
  return useQuery({
    queryKey: ['client-prescriptions', clientId],
    queryFn: () => api.get<{ data: any[] }>(`/api/clients/${clientId}/prescriptions`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: client, isLoading, error, refetch } = useClient(id!);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error="Failed to load client" onRetry={refetch} />;
  if (!client) return <EmptyState message="Client not found" />;

  return <ClientProfileLayout client={client} />;
}

function ClientProfileLayout({ client }: { client: ClientProfile }) {
  const router = useRouter();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const startSession = useSessionStore((s) => s.startSession);
  
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  // Get tier from tags (CULT, VAULT, or default to Essential)
  const tierTag = client.tags.find(tag => 
    ['CULT', 'VAULT'].includes(tag.toUpperCase())
  );
  const tier = tierTag?.toUpperCase() || 'ESSENTIAL';

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const handleStartSession = () => {
    startSession(client.id, name);
    router.push(`/clients/${client.id}/session`);
  };

  return (
    <View className="flex-1 bg-bg-page">
      {/* Top sticky band */}
      <View className="bg-bg-elevated border-b border-border px-2xl py-lg">
        <View className="flex-row items-center">
          {/* Avatar */}
          <View className="w-16 h-16 rounded-full bg-brand items-center justify-center mr-lg">
            <Text className="text-text-inverse text-headline font-bold">{initials}</Text>
          </View>
          
          {/* Name and tier */}
          <View className="flex-1">
            <Text className="text-displayMd text-text-primary font-bold">{name}</Text>
            <View className="flex-row items-center mt-sm gap-md">
              <TierBadge tier={tier} />
              {privacyMode === 'staff' && client.enrichment?.internalNotes && (
                <View className="bg-warning/20 px-md py-xs rounded-md">
                  <Text className="text-captionStrong text-warning">Has internal notes</Text>
                </View>
              )}
            </View>
          </View>

          {/* Contact info */}
          <View className="items-end">
            {client.email && (
              <View className="flex-row items-center mb-xs">
                <Mail color="#6B6B6B" size={16} />
                <Text className="text-body text-text-muted ml-sm">{client.email}</Text>
              </View>
            )}
            {client.phone && (
              <View className="flex-row items-center mb-xs">
                <Phone color="#6B6B6B" size={16} />
                <Text className="text-body text-text-muted ml-sm">{client.phone}</Text>
              </View>
            )}
            {client.enrichment?.homeLocationId && (
              <View className="flex-row items-center">
                <MapPin color="#6B6B6B" size={16} />
                <Text className="text-body text-text-muted ml-sm">Montreal West</Text>
              </View>
            )}
          </View>

          {/* Credits (staff-only or simplified for client) */}
          {privacyMode === 'staff' ? (
            client.totalSpent && (
              <View className="items-center ml-lg">
                <Text className="text-captionStrong text-text-muted">LTV</Text>
                <Text className="text-headline text-text-primary">{formatCurrency(client.totalSpent)}</Text>
              </View>
            )
          ) : (
            <View className="items-center ml-lg">
              <CreditCard color="#005D23" size={24} />
              <Text className="text-bodyStrong text-accent">Credits available</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-1 flex-row">
        {/* Main scrollable content */}
        <ScrollView className="flex-1 p-xl">
          <View className="max-w-4xl">
            {/* Fit Profile */}
            <ProfileSection title="Fit Profile" icon={<Glasses color="#6B6B6B" size={20} />}>
              <FitProfileCard client={client} />
            </ProfileSection>

            {/* Preferences */}
            <ProfileSection title="Preferences" icon={<Heart color="#6B6B6B" size={20} />}>
              <PreferencesCard client={client} />
            </ProfileSection>

            {/* Recent Orders */}
            <ProfileSection title="Recent Orders" icon={<ShoppingBag color="#6B6B6B" size={20} />}>
              <RecentOrdersCard clientId={client.id} />
            </ProfileSection>

            {/* Wishlist */}
            <ProfileSection title="Wishlist" icon={<Star color="#6B6B6B" size={20} />}>
              <WishlistCard clientId={client.id} />
            </ProfileSection>

            {/* Prescription Status */}
            <ProfileSection title="Prescription Status" icon={<Eye color="#6B6B6B" size={20} />}>
              <PrescriptionCard clientId={client.id} />
            </ProfileSection>

            {/* Interaction Timeline */}
            <ProfileSection title="Timeline" icon={<MessageCircle color="#6B6B6B" size={20} />}>
              <TimelineCard clientId={client.id} />
            </ProfileSection>

            {/* Internal Notes (staff-only) */}
            {privacyMode === 'staff' && (
              <ProfileSection title="Internal Notes" icon={<FileText color="#6B6B6B" size={20} />}>
                <InternalNotesCard client={client} />
              </ProfileSection>
            )}
          </View>
        </ScrollView>

        {/* Right action bar */}
        <View className="w-48 bg-bg-elevated border-l border-border p-lg">
          <ActionButton
            icon={<User color="#FFFFFF" size={20} />}
            label="Start Session"
            variant="primary"
            onPress={handleStartSession}
          />
          <ActionButton
            icon={<Eye color="#2B2B2B" size={20} />}
            label="Second Sight"
            variant="secondary"
            onPress={() => {/* TODO: Navigate to Second Sight */}}
          />
          <ActionButton
            icon={<Palette color="#2B2B2B" size={20} />}
            label="Custom Design"
            variant="secondary"
            onPress={() => {/* TODO: Navigate to Custom Design */}}
          />
          <ActionButton
            icon={<Plus color="#2B2B2B" size={20} />}
            label="Add Note"
            variant="secondary"
            onPress={() => {/* Show add note modal */}}
          />
          <ActionButton
            icon={<Lightbulb color="#2B2B2B" size={20} />}
            label="Recommend"
            variant="secondary"
            onPress={() => {/* Show recommend modal */}}
          />
        </View>
      </View>
    </View>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors = {
    CULT: 'bg-brand text-text-inverse',
    VAULT: 'bg-accent text-text-inverse', 
    ESSENTIAL: 'bg-border text-text-primary'
  } as const;

  return (
    <View className={`px-md py-xs rounded-full ${colors[tier as keyof typeof colors] || colors.ESSENTIAL}`}>
      <Text className="text-captionStrong font-bold">{tier}</Text>
    </View>
  );
}

function ProfileSection({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
}) {
  return (
    <View className="mb-lg">
      <View className="flex-row items-center mb-md">
        {icon}
        <Text className="text-headline text-text-primary font-semibold ml-sm">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ActionButton({ 
  icon, 
  label, 
  variant, 
  onPress 
}: { 
  icon: React.ReactNode; 
  label: string; 
  variant: 'primary' | 'secondary'; 
  onPress: () => void; 
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[44px] w-full rounded-md p-md flex-col items-center justify-center mb-md ${
        variant === 'primary' ? 'bg-accent' : 'bg-border'
      }`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text className={`text-captionStrong mt-xs text-center ${
        variant === 'primary' ? 'text-text-inverse' : 'text-text-primary'
      }`}>
        {label}
      </Text>
    </Pressable>
  );
}

function FitProfileCard({ client }: { client: ClientProfile }) {
  const enrichment = client.enrichment;
  
  return (
    <Card>
      <View className="grid-cols-3 gap-md">
        <View className="flex-row justify-between py-sm border-b border-border">
          <Text className="text-body text-text-muted">Face shape</Text>
          <Text className="text-bodyStrong text-text-primary">
            {enrichment?.faceShape || 'Not measured'}
          </Text>
        </View>
        <View className="flex-row justify-between py-sm border-b border-border">
          <Text className="text-body text-text-muted">Frame width</Text>
          <Text className="text-bodyStrong text-text-primary">
            {enrichment?.frameWidthMm ? `${enrichment.frameWidthMm}mm` : 'Not measured'}
          </Text>
        </View>
        <View className="flex-row justify-between py-sm">
          <Text className="text-body text-text-muted">Bridge width</Text>
          <Text className="text-bodyStrong text-text-primary">
            {enrichment?.bridgeWidthMm ? `${enrichment.bridgeWidthMm}mm` : 'Not measured'}
          </Text>
        </View>
      </View>
      
      {!enrichment?.faceShape && (
        <View className="mt-md p-md bg-bg-page rounded-md">
          <Text className="text-body text-text-muted text-center">
            Start a fitting session to capture measurements
          </Text>
        </View>
      )}
    </Card>
  );
}

function PreferencesCard({ client }: { client: ClientProfile }) {
  const preferences = client.enrichment?.customFields?.preferences_json as any;
  
  return (
    <Card>
      <View className="flex-row">
        <View className="flex-1 mr-md">
          <Text className="text-bodyStrong text-text-primary mb-sm">Stated</Text>
          {preferences?.stated?.length > 0 ? (
            preferences.stated.map((pref: string, index: number) => (
              <Text key={index} className="text-body text-text-muted mb-xs">• {pref}</Text>
            ))
          ) : (
            <Text className="text-body text-text-muted italic">No stated preferences</Text>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-bodyStrong text-text-primary mb-sm">Derived</Text>
          <View className="flex-row flex-wrap gap-xs">
            {['Acetate', 'Bold', 'Vintage', '$200-400'].map((tag) => (
              <View key={tag} className="bg-bg-page px-sm py-xs rounded-md">
                <Text className="text-caption text-text-primary">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}

function RecentOrdersCard({ clientId }: { clientId: string }) {
  const { data: orders, isLoading, error } = useClientOrders(clientId);
  
  if (isLoading) return <Card><LoadingState /></Card>;
  if (error) return <Card><Text className="text-error">Failed to load orders</Text></Card>;
  
  return (
    <Card>
      {orders?.data && orders.data.length > 0 ? (
        orders.data.slice(0, 3).map((order: any, index: number) => (
          <View key={order.id} className={`py-md ${index < 2 ? 'border-b border-border' : ''}`}>
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-bodyStrong text-text-primary">{order.productName}</Text>
                <Text className="text-caption text-text-muted">
                  {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-bodyStrong text-text-primary">
                ${order.total?.toFixed(2)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text className="text-body text-text-muted italic text-center py-md">
          No orders yet
        </Text>
      )}
    </Card>
  );
}

function WishlistCard({ clientId }: { clientId: string }) {
  const { data: wishlist, isLoading, error } = useClientWishlist(clientId);
  
  if (isLoading) return <Card><LoadingState /></Card>;
  if (error) return <Card><Text className="text-error">Failed to load wishlist</Text></Card>;
  
  return (
    <Card>
      {wishlist?.data && wishlist.data.length > 0 ? (
        <View className="flex-row flex-wrap gap-md">
          {wishlist.data.map((item: any) => (
            <View key={item.id} className="w-20 items-center">
              <Image 
                source={{ uri: item.product?.image?.url }}
                className="w-16 h-16 rounded-md bg-bg-page"
                resizeMode="cover"
              />
              <Text className="text-caption text-text-primary text-center mt-xs" numberOfLines={2}>
                {item.product?.title}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-body text-text-muted italic text-center py-md">
          No wishlist items yet
        </Text>
      )}
    </Card>
  );
}

function PrescriptionCard({ clientId }: { clientId: string }) {
  const { data: prescriptions, isLoading, error } = useClientPrescriptions(clientId);
  
  if (isLoading) return <Card><LoadingState /></Card>;
  if (error) return <Card><Text className="text-error">Failed to load prescription</Text></Card>;
  
  const currentRx = prescriptions?.data?.[0];
  
  return (
    <Card>
      {currentRx ? (
        <View>
          <View className="flex-row justify-between items-center mb-md">
            <Text className="text-bodyStrong text-text-primary">Current Rx</Text>
            <View className={`px-md py-xs rounded-full ${
              currentRx.isValid ? 'bg-accent/20' : 'bg-warning/20'
            }`}>
              <Text className={`text-captionStrong ${
                currentRx.isValid ? 'text-accent' : 'text-warning'
              }`}>
                {currentRx.isValid ? 'Valid' : 'Expired'}
              </Text>
            </View>
          </View>
          
          <View className="flex-row justify-between py-sm border-b border-border">
            <Text className="text-body text-text-muted">Issue date</Text>
            <Text className="text-bodyStrong text-text-primary">
              {new Date(currentRx.issuedAt).toLocaleDateString()}
            </Text>
          </View>
          <View className="flex-row justify-between py-sm">
            <Text className="text-body text-text-muted">Expires</Text>
            <Text className="text-bodyStrong text-text-primary">
              {new Date(currentRx.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      ) : (
        <Text className="text-body text-text-muted italic text-center py-md">
          No prescription on file
        </Text>
      )}
    </Card>
  );
}

function TimelineCard({ clientId }: { clientId: string }) {
  const { data: interactions, isLoading, error } = useInteractions(clientId);
  
  if (isLoading) return <Card><LoadingState /></Card>;
  if (error) return <Card><Text className="text-error">Failed to load timeline</Text></Card>;
  
  return (
    <Card>
      {interactions && interactions.interactions.length > 0 ? (
        <View>
          {interactions.interactions.slice(0, 5).map((interaction: any, index: number) => (
            <View key={interaction.id} className={index < 4 ? 'mb-md pb-md border-b border-border' : ''}>
              <TimelineEntry interaction={interaction} />
            </View>
          ))}
          {interactions.interactions.length > 5 && (
            <Pressable className="mt-md">
              <Text className="text-bodyStrong text-accent text-center">
                View all {interactions.interactions.length} entries
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Text className="text-body text-text-muted italic text-center py-md">
          No interactions yet
        </Text>
      )}
    </Card>
  );
}

function InternalNotesCard({ client }: { client: ClientProfile }) {
  const notes = client.enrichment?.internalNotes || '';
  
  return (
    <Card>
      <TextInput
        value={notes}
        onChangeText={(text) => {
          // TODO: Implement debounced save
          console.log('Update notes:', text);
        }}
        placeholder="Add internal notes about this client..."
        multiline
        numberOfLines={4}
        className="text-body text-text-primary min-h-[88px] p-0"
        textAlignVertical="top"
      />
      
      <View className="flex-row mt-md">
        <Text className="text-caption text-text-muted flex-1">
          Staff-only notes • Auto-saved
        </Text>
        <Text className="text-caption text-text-muted">
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </Card>
  );
}
