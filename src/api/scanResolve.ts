import { api } from './client';

/** Foundry `GET /api/inventory/scan/resolve?code=` (frame tag `IT-…` or shelf `SL-…`). */
export type ScanResult =
  | {
      type: 'item';
      item: {
        id: string; sku: string | null; name: string; qrCode: string | null; groupName: string | null;
        familyName: string | null; colour: string | null; colourHex: string | null;
        locationLevels: Array<{ locationId: string; locationName: string; onHand: number; committed: number }>;
        shelf: { code: string; label: string | null; locationName: string } | null;
      };
    }
  | {
      type: 'shelf';
      shelf: { id: string; code: string; label: string | null; locationName: string };
      items: Array<{ id: string; sku: string | null; name: string; onHand: number }>;
    };

export function resolveScanCode(code: string): Promise<ScanResult> {
  return api.get<ScanResult>('/api/inventory/scan/resolve', { params: { code } });
}

/** Best catalogue search term for a scanned item: family + colour, else its name. */
export function catalogueQuery(item: { familyName: string | null; colour: string | null; name: string }): string {
  return item.familyName ? `${item.familyName}${item.colour ? ` ${item.colour}` : ''}` : item.name;
}
