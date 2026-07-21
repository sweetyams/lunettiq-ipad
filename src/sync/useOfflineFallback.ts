import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { Q } from '@nozbe/watermelondb';
import { api } from '@/src/api/client';
import { getCollections } from '@/src/db';
import { useSyncStore } from './useSyncStore';
import { Product, Client, Appointment } from '@/src/db/models';

/**
 * Hook that provides offline-first products data
 * When online: fetches from API via TanStack Query
 * When offline: reads from WatermelonDB cache
 */
export function useOfflineProducts(options?: {
  search?: string;
  filters?: Record<string, string>;
  limit?: number;
}): UseQueryResult<Product[]> {
  const { isOnline } = useSyncStore();
  
  return useQuery({
    queryKey: ['products', 'offline', options],
    queryFn: async (): Promise<Product[]> => {
      if (isOnline) {
        // When online: fetch from API
        const params: Record<string, string> = {
          limit: (options?.limit || 500).toString(),
        };
        
        if (options?.search) {
          params.q = options.search;
        }
        
        // Add filters
        if (options?.filters) {
          Object.assign(params, options.filters);
        }
        
        const apiProducts = await api.get<any[]>('/api/storefront/products', { params });
        
        // Convert API response to Product models for consistency
        // Note: This doesn't persist to DB - that's handled by sync hooks
        return apiProducts.map(p => {
          // Create a Product-like object for UI consistency
          return {
            ...p,
            // Ensure computed properties work
            get displayPrice() { return `$${(p.price / 100).toFixed(2)}`; },
            get isInStock() { return p.stockLevel > 0; },
            get familyName() { return `${p.vendor} ${p.familyCode}`; },
            getStockForLocation: (locationId: string) => p.locationStock?.[locationId] || 0
          } as Product;
        });
      } else {
        // When offline: read from WatermelonDB
        const collections = getCollections();
        const clauses = [];
        
        // Apply search filter if provided
        if (options?.search) {
          clauses.push(Q.where('title', Q.like(`%${Q.sanitizeLikeString(options.search)}%`)));
        }
        
        // Apply limit
        if (options?.limit) {
          clauses.push(Q.take(options.limit));
        }
        
        clauses.push(Q.sortBy('sort_order', Q.asc));
        
        return await collections.products.query(...clauses).fetch();
      }
    },
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity, // 5 min when online, never stale when offline
    retry: isOnline ? 2 : 0, // Don't retry when offline
    enabled: true,
  });
}

/**
 * Hook that provides offline-first clients data
 * When online: fetches from API via TanStack Query
 * When offline: reads from WatermelonDB cache
 */
export function useOfflineClients(search?: string): UseQueryResult<Client[]> {
  const { isOnline } = useSyncStore();
  
  return useQuery({
    queryKey: ['clients', 'offline', search],
    queryFn: async (): Promise<Client[]> => {
      if (isOnline) {
        // When online: fetch from API
        const params: Record<string, string> = {
          limit: '100', // Reasonable limit for client search
        };
        
        if (search) {
          params.q = search;
        }
        
        const apiClients = await api.get<any[]>('/api/clients', { params });
        
        // Convert API response to Client models for consistency
        return apiClients.map(c => ({
          ...c,
          // Ensure computed properties work
          get fullName() { return `${c.firstName} ${c.lastName}`; },
          get displayName() { return `${c.firstName} ${c.lastName.charAt(0)}.`; },
          get tier() { return c.tierTag || 'standard'; },
          get lifetimeValue() { return `$${(c.totalSpent / 100).toFixed(2)}`; },
          get initials() { return `${c.firstName.charAt(0)}${c.lastName.charAt(0)}`.toUpperCase(); },
          hasTag: (tag: string) => c.tags?.includes(tag) || false,
          get isVip() { return c.tags?.includes('VIP') || c.tierTag === 'cult'; }
        } as Client));
      } else {
        // When offline: read from WatermelonDB
        const collections = getCollections();
        const clauses = [];
        
        // Apply search filter if provided
        if (search) {
          clauses.push(
            Q.or(
              Q.where('first_name', Q.like(`%${Q.sanitizeLikeString(search)}%`)),
              Q.where('last_name', Q.like(`%${Q.sanitizeLikeString(search)}%`)),
              Q.where('email', Q.like(`%${Q.sanitizeLikeString(search)}%`))
            )
          );
        }
        
        clauses.push(Q.sortBy('last_activity_at', Q.desc));
        clauses.push(Q.take(100));
        
        return await collections.clients.query(...clauses).fetch();
      }
    },
    staleTime: isOnline ? 2 * 60 * 1000 : Infinity, // 2 min when online, never stale when offline
    retry: isOnline ? 2 : 0,
    enabled: true,
  });
}

/**
 * Hook that provides offline-first appointments data
 * When online: fetches from API via TanStack Query
 * When offline: reads from WatermelonDB cache
 */
export function useOfflineAppointments(date: string): UseQueryResult<Appointment[]> {
  const { isOnline } = useSyncStore();
  
  return useQuery({
    queryKey: ['appointments', 'offline', date],
    queryFn: async (): Promise<Appointment[]> => {
      if (isOnline) {
        // When online: fetch from API
        const apiAppointments = await api.get<any[]>('/api/scheduling', {
          params: { date }
        });
        
        // Convert API response to Appointment models for consistency
        return apiAppointments.map(a => ({
          ...a,
          startsAt: new Date(a.startsAt),
          endsAt: new Date(a.endsAt),
          reminderSentAt: a.reminderSentAt ? new Date(a.reminderSentAt) : undefined,
          syncedAt: new Date(),
          // Ensure computed properties work
          get duration() { return this.endsAt.getTime() - this.startsAt.getTime(); },
          get durationMinutes() { return Math.round(this.duration / (1000 * 60)); },
          get isPast() { return this.endsAt < new Date(); },
          get isToday() {
            const today = new Date();
            const appointmentDate = this.startsAt;
            return (
              today.getFullYear() === appointmentDate.getFullYear() &&
              today.getMonth() === appointmentDate.getMonth() &&
              today.getDate() === appointmentDate.getDate()
            );
          },
          get isUpcoming() { return this.startsAt > new Date(); },
          get isActive() {
            const now = new Date();
            return this.startsAt <= now && this.endsAt >= now;
          },
          get timeSlot() {
            const start = this.startsAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: false,
            });
            const end = this.endsAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: false,
            });
            return `${start}–${end}`;
          },
          canCheckIn: () => a.status === 'confirmed',
          canStartSession: () => a.status === 'in_progress'
        } as Appointment));
      } else {
        // When offline: read from WatermelonDB
        const collections = getCollections();
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        return await collections.appointments
          .query(
            Q.where('starts_at', Q.gte(startOfDay.getTime())),
            Q.where('starts_at', Q.lt(endOfDay.getTime())),
            Q.sortBy('starts_at', Q.asc)
          )
          .fetch();
      }
    },
    staleTime: isOnline ? 1 * 60 * 1000 : Infinity, // 1 min when online, never stale when offline
    retry: isOnline ? 2 : 0,
    enabled: true,
  });
}

/**
 * Hook that provides individual client data with offline fallback
 */
export function useOfflineClient(id: string): UseQueryResult<Client | null> {
  const { isOnline } = useSyncStore();
  
  return useQuery({
    queryKey: ['clients', id, 'offline'],
    queryFn: async (): Promise<Client | null> => {
      if (isOnline) {
        // When online: fetch from API
        try {
          const apiClient = await api.get<any>(`/api/clients/${id}`);
          
          // Convert API response to Client model for consistency
          return {
            ...apiClient,
            // Ensure computed properties work
            get fullName() { return `${apiClient.firstName} ${apiClient.lastName}`; },
            get displayName() { return `${apiClient.firstName} ${apiClient.lastName.charAt(0)}.`; },
            get tier() { return apiClient.tierTag || 'standard'; },
            get lifetimeValue() { return `$${(apiClient.totalSpent / 100).toFixed(2)}`; },
            get initials() { return `${apiClient.firstName.charAt(0)}${apiClient.lastName.charAt(0)}`.toUpperCase(); },
            hasTag: (tag: string) => apiClient.tags?.includes(tag) || false,
            get isVip() { return apiClient.tags?.includes('VIP') || apiClient.tierTag === 'cult'; }
          } as Client;
        } catch (error) {
          return null;
        }
      } else {
        // When offline: read from WatermelonDB
        const collections = getCollections();
        const clients = await collections.clients
          .query(Q.where('foundry_id', id))
          .fetch();
        
        return clients[0] || null;
      }
    },
    staleTime: isOnline ? 1 * 60 * 1000 : Infinity,
    retry: isOnline ? 2 : 0,
    enabled: !!id,
  });
}