/**
 * Pure helpers that translate the iPad's local session state into the
 * shapes Foundry's try-on session and product-interaction endpoints expect.
 *
 * Foundry contract (crm/ai-stylist/tryon-sessions.ts, crm/product-interactions/handlers.ts):
 * - Interaction `type` drives feedback + hot leads: 'tried_on' and 'liked' emit
 *   `product_interaction.created`; 'disliked' records negative sentiment.
 * - Interaction `source` must be 'tablet' (or 'in_store') for the hot-leads
 *   in-store gate — anything else is treated as a storefront try-on.
 */
import type { FrameTried } from './useSessionStore';

/** Placeholder ids are minted locally until Foundry returns a real session id. */
export function isLocalSessionId(id: string | null | undefined): boolean {
  return !id || id.startsWith('ses_');
}

export type ServerInteractionType = 'tried_on' | 'liked' | 'disliked';

/** Verdict → the interaction type Foundry understands. Unsure/none records nothing extra. */
export function verdictToInteractionType(
  verdict: FrameTried['verdict'],
): Extract<ServerInteractionType, 'liked' | 'disliked'> | null {
  switch (verdict) {
    case 'loved':
    case 'liked':
      return 'liked';
    case 'rejected':
      return 'disliked';
    default:
      return null;
  }
}

/** Shape stored on the server session's `framesTried` (PATCH /tryon-sessions/{id}). */
export interface ServerFrameTried {
  productId: string;
  variantId?: string;
  verdict: 'loved' | 'liked' | 'unsure' | 'rejected' | null;
  notes: string;
  photoKeys: string[];
}

export function toServerFramesTried(frames: FrameTried[]): ServerFrameTried[] {
  return frames.map((f) => ({
    productId: f.productId,
    ...(f.variantId ? { variantId: f.variantId } : {}),
    verdict: f.verdict ?? null,
    notes: f.notes ?? '',
    // Photo upload to R2 isn't wired yet (WS1); keys land here once it is.
    photoKeys: [],
  }));
}

/** Frames whose `tried_on` interaction hasn't reached Foundry yet. */
export function unsyncedFrames(frames: FrameTried[]): FrameTried[] {
  return frames.filter((f) => !f.syncedAt);
}
