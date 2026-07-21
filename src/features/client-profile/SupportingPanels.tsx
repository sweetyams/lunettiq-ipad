import { View, Text, Image, Pressable } from 'react-native';
import { ShoppingBag, Eye, Star, Tag, Glasses as GlassesIcon, Link2, Users, Award, Receipt, ClipboardList } from 'lucide-react-native';
import {
  useClientOrders,
  useClientPrescriptions,
  useClientWishlist,
  useClientSegments,
  useClientProductInteractions,
  useClientTryonSessions,
  useClientLinks,
} from '@/src/api/useClients';
import { useLoyaltyBalance, useIssueCredit } from '@/src/api/useLoyalty';
import { useReceipts, useSendReceipt } from '@/src/api/useReceipts';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { PermissionGate } from '@/src/ui/PermissionGate';
import { Card, LoadingState } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';
import type {
  ClientOrder,
  Prescription,
  WishlistItem,
  ClientSegment,
  ProductInteraction,
  TryonSession,
  ClientLink,
} from '@/src/api/clients.types';

// ─── Orders Panel ────────────────────────────────────────────

interface OrdersPanelProps {
  clientId: string;
}

export function OrdersPanel({ clientId }: OrdersPanelProps) {
  const { data: orders, isLoading } = useClientOrders(clientId);
  const privacyMode = usePrivacyStore((s) => s.mode);

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <ShoppingBag color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">Orders</Text>
        {orders && (
          <Text className="text-caption text-text-muted ml-sm">{orders.length} total</Text>
        )}
      </View>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : orders && orders.length > 0 ? (
          orders.slice(0, 5).map((order, index) => (
            <View
              key={order.id}
              className={`py-md ${index < Math.min(orders.length, 5) - 1 ? 'border-b border-border' : ''}`}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-bodyStrong text-text-primary">
                    Order #{order.orderNumber}
                  </Text>
                  <Text className="text-caption text-text-muted mt-xs">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.lineItems.length} items
                  </Text>
                  {order.lineItems.slice(0, 2).map((item) => (
                    <Text key={item.id} className="text-caption text-text-muted mt-xs">
                      {item.title}{item.variantTitle ? ` - ${item.variantTitle}` : ''}
                    </Text>
                  ))}
                </View>
                <View className="items-end">
                  {privacyMode === 'staff' && (
                    <Text className="text-bodyStrong text-text-primary">
                      ${order.totalPrice.toFixed(2)}
                    </Text>
                  )}
                  <OrderStatusBadge status={order.fulfillmentStatus ?? order.financialStatus} />
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-body text-text-muted italic text-center py-md">No orders yet</Text>
        )}
      </Card>
    </View>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-accent/20 text-accent',
    fulfilled: 'bg-accent/20 text-accent',
    pending: 'bg-warning/20 text-warning',
    unfulfilled: 'bg-warning/20 text-warning',
    refunded: 'bg-border text-text-muted',
  };
  const cls = colors[status] ?? 'bg-border text-text-muted';
  return (
    <View className={`px-sm py-xs rounded-md mt-xs ${cls.split(' ')[0]}`}>
      <Text className={`text-caption font-medium ${cls.split(' ')[1]}`}>
        {status}
      </Text>
    </View>
  );
}

// ─── Prescriptions Panel ─────────────────────────────────────

interface PrescriptionsPanelProps {
  clientId: string;
}

export function PrescriptionsPanel({ clientId }: PrescriptionsPanelProps) {
  const { data: prescriptions, isLoading } = useClientPrescriptions(clientId);

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <Eye color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">Prescriptions</Text>
      </View>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : prescriptions && prescriptions.length > 0 ? (
          prescriptions.map((rx, index) => (
            <PrescriptionRow key={rx.id} rx={rx} isLast={index === prescriptions.length - 1} />
          ))
        ) : (
          <Text className="text-body text-text-muted italic text-center py-md">
            No prescription on file
          </Text>
        )}
      </Card>
    </View>
  );
}

function PrescriptionRow({ rx, isLast }: { rx: Prescription; isLast: boolean }) {
  return (
    <View className={`py-md ${!isLast ? 'border-b border-border' : ''}`}>
      <View className="flex-row justify-between items-center mb-sm">
        <Text className="text-bodyStrong text-text-primary">
          {rx.prescriber ?? 'Unknown prescriber'}
        </Text>
        <View className={`px-md py-xs rounded-full ${rx.isValid ? 'bg-accent/20' : 'bg-warning/20'}`}>
          <Text className={`text-captionStrong ${rx.isValid ? 'text-accent' : 'text-warning'}`}>
            {rx.isValid ? 'Valid' : rx.status}
          </Text>
        </View>
      </View>

      {/* Rx values table */}
      {(rx.rightEye || rx.leftEye) && (
        <View className="bg-bg-page rounded-md p-sm mt-sm">
          <View className="flex-row mb-xs">
            <Text className="text-caption text-text-muted w-12" />
            <Text className="text-caption text-text-muted w-16 text-center">SPH</Text>
            <Text className="text-caption text-text-muted w-16 text-center">CYL</Text>
            <Text className="text-caption text-text-muted w-16 text-center">AXIS</Text>
          </View>
          {rx.rightEye && (
            <View className="flex-row">
              <Text className="text-captionStrong text-text-primary w-12">OD</Text>
              <Text className="text-caption text-text-primary w-16 text-center font-mono">
                {rx.rightEye.sphere != null ? formatRx(rx.rightEye.sphere) : '—'}
              </Text>
              <Text className="text-caption text-text-primary w-16 text-center font-mono">
                {rx.rightEye.cylinder != null ? formatRx(rx.rightEye.cylinder) : '—'}
              </Text>
              <Text className="text-caption text-text-primary w-16 text-center font-mono">
                {rx.rightEye.axis ?? '—'}
              </Text>
            </View>
          )}
          {rx.leftEye && (
            <View className="flex-row mt-xs">
              <Text className="text-captionStrong text-text-primary w-12">OS</Text>
              <Text className="text-caption text-text-primary w-16 text-center font-mono">
                {rx.leftEye.sphere != null ? formatRx(rx.leftEye.sphere) : '—'}
              </Text>
              <Text className="text-caption text-text-primary w-16 text-center font-mono">
                {rx.leftEye.cylinder != null ? formatRx(rx.leftEye.cylinder) : '—'}
              </Text>
              <Text className="text-caption text-text-primary w-16 text-center font-mono">
                {rx.leftEye.axis ?? '—'}
              </Text>
            </View>
          )}
          {rx.addPower != null && (
            <View className="flex-row mt-xs">
              <Text className="text-captionStrong text-text-primary w-12">ADD</Text>
              <Text className="text-caption text-text-primary font-mono">
                {formatRx(rx.addPower)}
              </Text>
            </View>
          )}
          {rx.pd != null && (
            <View className="flex-row mt-xs">
              <Text className="text-captionStrong text-text-primary w-12">PD</Text>
              <Text className="text-caption text-text-primary font-mono">{rx.pd}mm</Text>
            </View>
          )}
        </View>
      )}

      <View className="flex-row justify-between mt-sm">
        <Text className="text-caption text-text-muted">
          Issued: {new Date(rx.issuedAt).toLocaleDateString()}
        </Text>
        <Text className="text-caption text-text-muted">
          Expires: {new Date(rx.expiresAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

function formatRx(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

// ─── Wishlist Panel ──────────────────────────────────────────

interface WishlistPanelProps {
  clientId: string;
}

export function WishlistPanel({ clientId }: WishlistPanelProps) {
  const { data: wishlist, isLoading } = useClientWishlist(clientId);

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <Star color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">Wishlist</Text>
        {wishlist && (
          <Text className="text-caption text-text-muted ml-sm">{wishlist.length} items</Text>
        )}
      </View>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : wishlist && wishlist.length > 0 ? (
          <View className="flex-row flex-wrap gap-md">
            {wishlist.map((item) => (
              <View key={item.id} className="w-24 items-center">
                {item.product?.image ? (
                  <Image
                    source={{ uri: item.product.image.url }}
                    className="w-20 h-20 rounded-md bg-bg-page"
                    resizeMode="cover"
                    accessibilityLabel={item.product?.title ?? 'Product image'}
                  />
                ) : (
                  <View className="w-20 h-20 rounded-md bg-bg-page items-center justify-center">
                    <GlassesIcon color="#6B6B6B" size={24} />
                  </View>
                )}
                <Text className="text-caption text-text-primary text-center mt-xs" numberOfLines={2}>
                  {item.product?.title ?? 'Unknown product'}
                </Text>
                {item.notes && (
                  <Text className="text-caption text-text-muted text-center" numberOfLines={1}>
                    {item.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-body text-text-muted italic text-center py-md">
            No wishlist items yet
          </Text>
        )}
      </Card>
    </View>
  );
}

// ─── Segments Panel ──────────────────────────────────────────

interface SegmentsPanelProps {
  clientId: string;
}

export function SegmentsPanel({ clientId }: SegmentsPanelProps) {
  const { data: segments, isLoading } = useClientSegments(clientId);

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <Tag color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">Segments</Text>
      </View>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : segments && segments.length > 0 ? (
          <View className="flex-row flex-wrap gap-sm">
            {segments.map((segment) => (
              <View key={segment.id} className="bg-bg-page px-md py-sm rounded-md">
                <Text className="text-bodyStrong text-text-primary">
                  {segment.name.en || segment.name.fr}
                </Text>
                <Text className="text-caption text-text-muted">
                  {segment.memberCount} members
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-body text-text-muted italic text-center py-md">
            Not in any segments
          </Text>
        )}
      </Card>
    </View>
  );
}

// ─── Product Interactions Panel ──────────────────────────────

interface ProductInteractionsPanelProps {
  clientId: string;
}

export function ProductInteractionsPanel({ clientId }: ProductInteractionsPanelProps) {
  const { data: interactions, isLoading } = useClientProductInteractions(clientId);

  const typeLabels: Record<string, string> = {
    viewed: 'Viewed',
    tried_on: 'Tried On',
    liked: 'Liked',
    disliked: 'Disliked',
    saved: 'Saved',
    shared: 'Shared',
    purchased: 'Purchased',
    recommended: 'Recommended',
  };

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <GlassesIcon color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">
          Product History
        </Text>
        {interactions && (
          <Text className="text-caption text-text-muted ml-sm">
            {interactions.length} interactions
          </Text>
        )}
      </View>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : interactions && interactions.length > 0 ? (
          interactions.slice(0, 10).map((pi, index) => (
            <View
              key={pi.id}
              className={`flex-row items-center py-sm ${
                index < Math.min(interactions.length, 10) - 1 ? 'border-b border-border' : ''
              }`}
            >
              <View className="flex-1">
                <Text className="text-body text-text-primary">
                  {pi.product?.title ?? pi.productId}
                </Text>
                <Text className="text-caption text-text-muted">
                  {typeLabels[pi.type] ?? pi.type} · {pi.source}
                </Text>
              </View>
              <Text className="text-caption text-text-muted">
                {new Date(pi.occurredAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-body text-text-muted italic text-center py-md">
            No product interactions yet
          </Text>
        )}
      </Card>
    </View>
  );
}

// ─── Try-on Sessions Panel ───────────────────────────────────

interface TryonSessionsPanelProps {
  clientId: string;
}

export function TryonSessionsPanel({ clientId }: TryonSessionsPanelProps) {
  const { data: sessions, isLoading } = useClientTryonSessions(clientId);

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <Users color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">
          Try-on Sessions
        </Text>
      </View>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : sessions && sessions.length > 0 ? (
          sessions.slice(0, 5).map((session, index) => (
            <View
              key={session.id}
              className={`py-md ${index < Math.min(sessions.length, 5) - 1 ? 'border-b border-border' : ''}`}
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-bodyStrong text-text-primary">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </Text>
                  <Text className="text-caption text-text-muted">
                    {session.framesTried} frames tried · {session.photosCount} photos
                  </Text>
                </View>
                <View className="items-end">
                  <SessionOutcomeBadge outcome={session.outcome} />
                  <Text className="text-caption text-text-muted mt-xs">{session.status}</Text>
                </View>
              </View>
              {session.notes && (
                <Text className="text-caption text-text-muted mt-sm">{session.notes}</Text>
              )}
            </View>
          ))
        ) : (
          <Text className="text-body text-text-muted italic text-center py-md">
            No sessions yet
          </Text>
        )}
      </Card>
    </View>
  );
}

function SessionOutcomeBadge({ outcome }: { outcome: TryonSession['outcome'] }) {
  if (!outcome) return null;
  const labels: Record<string, string> = {
    purchased: 'Purchased',
    booked: 'Booked',
    shortlisted: 'Shortlisted',
    left_empty: 'Left empty',
  };
  const colors: Record<string, string> = {
    purchased: 'bg-accent/20 text-accent',
    booked: 'bg-blue/20 text-blue',
    shortlisted: 'bg-warning/20 text-warning',
    left_empty: 'bg-border text-text-muted',
  };
  const cls = colors[outcome] ?? 'bg-border text-text-muted';
  return (
    <View className={`px-sm py-xs rounded-md ${cls.split(' ')[0]}`}>
      <Text className={`text-caption font-medium ${cls.split(' ')[1]}`}>
        {labels[outcome] ?? outcome}
      </Text>
    </View>
  );
}

// ─── Client Links Panel ──────────────────────────────────────

interface LinksPanelProps {
  clientId: string;
}

export function LinksPanel({ clientId }: LinksPanelProps) {
  const { data: links, isLoading } = useClientLinks(clientId);

  const relationshipLabels: Record<string, string> = {
    spouse: 'Spouse',
    parent: 'Parent',
    child: 'Child',
    sibling: 'Sibling',
    partner: 'Partner',
    colleague: 'Colleague',
    other: 'Other',
  };

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <Link2 color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">Relationships</Text>
      </View>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : links && links.length > 0 ? (
          links.map((link, index) => (
            <View
              key={link.id}
              className={`flex-row items-center py-md ${
                index < links.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-bg-page items-center justify-center mr-md">
                <Text className="text-captionStrong text-text-primary">
                  {[link.linkedClient.firstName?.[0], link.linkedClient.lastName?.[0]]
                    .filter(Boolean)
                    .join('')
                    .toUpperCase() || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-bodyStrong text-text-primary">
                  {[link.linkedClient.firstName, link.linkedClient.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Unknown'}
                </Text>
                <Text className="text-caption text-text-muted">
                  {relationshipLabels[link.relationshipType] ?? link.relationshipType}
                </Text>
              </View>
              {link.linkedClient.email && (
                <Text className="text-caption text-text-muted">{link.linkedClient.email}</Text>
              )}
            </View>
          ))
        ) : (
          <Text className="text-body text-text-muted italic text-center py-md">
            No linked clients
          </Text>
        )}
      </Card>
    </View>
  );
}

// ─── Loyalty Panel ───────────────────────────────────────────

interface LoyaltyPanelProps {
  clientId: string;
}

export function LoyaltyPanel({ clientId }: LoyaltyPanelProps) {
  const { data: loyalty, isLoading } = useLoyaltyBalance(clientId);
  const issueCredit = useIssueCredit(clientId);
  const privacyMode = usePrivacyStore((s) => s.mode);

  return (
    <PermissionGate permission="org:loyalty:read">
      <View>
        <View className="flex-row items-center mb-md">
          <Award color="#6B6B6B" size={20} />
          <Text className="text-headline text-text-primary font-semibold ml-sm">Loyalty Credits</Text>
        </View>

        <Card>
          {isLoading ? (
            <LoadingState />
          ) : loyalty ? (
            <View>
              {/* Balance */}
              <View className="py-sm border-b border-border">
                {privacyMode === 'staff' ? (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-body text-text-muted">Current balance</Text>
                    <Text className="text-headline text-text-primary font-semibold">
                      {loyalty.balance} credits
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-body text-text-muted">Loyalty credits</Text>
                    <Text className="text-body text-green font-medium">Credits available</Text>
                  </View>
                )}
              </View>

              {/* Recent ledger — staff only */}
              {privacyMode === 'staff' && loyalty.ledger?.slice(0, 5).map((entry, i) => (
                <View key={entry.id} className={`flex-row justify-between py-xs ${i > 0 ? 'border-t border-border' : ''}`}>
                  <View className="flex-1">
                    <Text className="text-body text-text-primary">{entry.reason}</Text>
                    <Text className="text-caption text-text-muted">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text className={`text-body font-medium ${entry.amount > 0 ? 'text-green' : 'text-error'}`}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount}
                  </Text>
                </View>
              ))}

              {/* Issue credit action — staff only */}
              {privacyMode === 'staff' && (
                <PermissionGate permission="org:loyalty:write">
                  <Pressable
                    className="mt-sm pt-sm border-t border-border min-h-[44px] justify-center"
                    onPress={() => {
                      // Courtesy credit — simplified inline action
                      issueCredit.mutate(
                        { amount: 500, reason: 'Courtesy credit', type: 'manual' },
                        {
                          onSuccess: () => toast.success('Credit issued', '+500 credits added'),
                          onError: () => toast.error('Failed to issue credit'),
                        }
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Issue courtesy credit, 5 dollars"
                  >
                    <Text className="text-body text-navy text-center">Issue courtesy credit</Text>
                  </Pressable>
                </PermissionGate>
              )}
            </View>
          ) : (
            <Text className="text-body text-text-muted italic text-center py-md">
              No loyalty data
            </Text>
          )}
        </Card>
      </View>
    </PermissionGate>
  );
}

// ─── Receipts Panel ──────────────────────────────────────────

interface ReceiptsPanelProps {
  clientId: string;
}

export function ReceiptsPanel({ clientId }: ReceiptsPanelProps) {
  const { data: receipts, isLoading } = useReceipts(clientId);
  const sendReceipt = useSendReceipt();

  return (
    <PermissionGate permission="org:receipts:read">
      <View>
        <View className="flex-row items-center mb-md">
          <Receipt color="#6B6B6B" size={20} />
          <Text className="text-headline text-text-primary font-semibold ml-sm">Insurance Receipts</Text>
        </View>

        <Card>
          {isLoading ? (
            <LoadingState />
          ) : receipts && receipts.length > 0 ? (
            receipts.slice(0, 5).map((receipt, i) => (
              <View
                key={receipt.id}
                className={`flex-row items-center py-md ${i < receipts.length - 1 ? 'border-b border-border' : ''}`}
              >
                <View className="flex-1">
                  <Text className="text-body text-text-primary">{receipt.insurerName}</Text>
                  <Text className="text-caption text-text-muted">
                    {new Date(receipt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {receipt.sentAt && ` · Sent ${new Date(receipt.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </Text>
                </View>
                <Text className="text-body text-text-primary mr-md">
                  ${(receipt.amount / 100).toFixed(2)}
                </Text>
                <PermissionGate permission="org:receipts:write">
                  <Pressable
                    onPress={() =>
                      sendReceipt.mutate(
                        { id: receipt.id },
                        {
                          onSuccess: () => toast.success('Receipt sent', `Emailed to client`),
                          onError: () => toast.error('Failed to send receipt'),
                        }
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Resend receipt for ${receipt.insurerName}, ${(receipt.amount / 100).toFixed(2)} dollars`}
                    className="min-h-[44px] px-md items-center justify-center border border-border rounded-md"
                  >
                    <Text className="text-caption text-navy">Resend</Text>
                  </Pressable>
                </PermissionGate>
              </View>
            ))
          ) : (
            <Text className="text-body text-text-muted italic text-center py-md">
              No receipts
            </Text>
          )}
        </Card>
      </View>
    </PermissionGate>
  );
}
