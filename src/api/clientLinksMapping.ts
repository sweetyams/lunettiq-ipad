import type { ClientLink, RelationshipType } from './clients.types';

/** Foundry crm_client_links row (no joined client; either side may be "us"). */
export interface FoundryClientLinkRow {
  id: string;
  clientAId: string;
  clientBId: string;
  relationshipType: string;
  createdBy?: string | null;
  createdAt: string;
}

const TYPES: RelationshipType[] = ['spouse', 'parent', 'child', 'sibling', 'partner', 'colleague', 'other'];

/** Maps a row to the iPad shape from `clientId`'s point of view. */
export function toClientLink(row: FoundryClientLinkRow, clientId: string, names: Map<string, string>): ClientLink {
  const otherId = row.clientAId === clientId ? row.clientBId : row.clientAId;
  const name = names.get(otherId) ?? '';
  const [firstName, ...rest] = name.split(' ');
  const type = TYPES.find((t) => t === row.relationshipType?.toLowerCase()) ?? 'other';
  return {
    id: row.id,
    clientAId: row.clientAId,
    clientBId: row.clientBId,
    relationshipType: type,
    linkedClient: { id: otherId, firstName: firstName || null, lastName: rest.join(' ') || null, email: null },
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt,
  };
}
