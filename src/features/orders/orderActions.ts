/**
 * What staff can do with an order at each state (gap checklist, Orders).
 *
 * Mirrors Foundry's rx-operations transition map (src/lib/modules/rx-operations/rules.ts):
 * `w` = org:rx:write (any staff), `v` = org:rx:verify (licensed optician). Moves
 * Foundry has no state for (lab confirmed, receiving problems, delayed) are recorded
 * as order notes and, where the checklist asks, open the matching client message.
 */

export type OrderAction =
  | 'add_rx'            // awaiting_rx: upload or take a photo of the prescription
  | 'remind_rx'         // awaiting_rx: preloaded reminder (highlighted from day 14)
  | 'request_approval'  // rx_submitted → optician_review + approval request
  | 'open_approval'     // optician_review: go to the Approvals inbox (opticians)
  | 'send_to_lab'       // ready_for_lab → at_lab (optician, credential)
  | 'lab_confirmed'     // at_lab: note + production update message (no Foundry state)
  | 'arrived'           // at_lab → received_from_lab (optician)
  | 'receiving_check'   // received_from_lab: verify contents, then ready / missing / redo
  | 'message_ready'     // ready_for_pickup: "ready" message
  | 'picked_up'         // ready_for_pickup → picked_up
  | 'mark_delayed'      // any production state: note + delay message
  | 'add_note';

export interface ActionPerms { canWrite: boolean; canVerify: boolean }

const PRODUCTION = new Set(['rx_submitted', 'optician_review', 'ready_for_lab', 'at_lab', 'received_from_lab']);

export function orderActions(state: string, perms: ActionPerms): OrderAction[] {
  const { canWrite, canVerify } = perms;
  const out: OrderAction[] = [];
  switch (state) {
    case 'awaiting_rx':
      if (canWrite) out.push('add_rx', 'remind_rx');
      break;
    case 'rx_submitted':
      if (canWrite) out.push('request_approval');
      break;
    case 'optician_review':
      if (canVerify) out.push('open_approval');
      break;
    case 'ready_for_lab':
      if (canVerify) out.push('send_to_lab');
      break;
    case 'at_lab':
      if (canWrite) out.push('lab_confirmed');
      if (canVerify) out.push('arrived');
      break;
    case 'received_from_lab':
      if (canVerify) out.push('receiving_check');
      break;
    case 'ready_for_pickup':
      if (canWrite) out.push('message_ready', 'picked_up');
      break;
  }
  if (canWrite && PRODUCTION.has(state)) out.push('mark_delayed');
  if (canWrite) out.push('add_note');
  return out;
}

/** The receiving check staff run when the lab box arrives. */
export const RECEIVING_CHECKS = [
  { key: 'frame', label: { en: 'Right frame and colour', fr: 'Bonne monture et couleur' } },
  { key: 'lenses', label: { en: 'Lenses match the order (type, treatments, tint)', fr: 'Verres conformes (type, traitements, teinte)' } },
  { key: 'power', label: { en: 'Power checked on the lensometer', fr: 'Puissance vérifiée au frontofocomètre' } },
  { key: 'centration', label: { en: 'Centration and heights correct', fr: 'Centrage et hauteurs corrects' } },
  { key: 'finish', label: { en: 'No scratches, clean edges, screws tight', fr: 'Sans rayures, bords propres, vis serrées' } },
  { key: 'extras', label: { en: 'Case and cloth in the box', fr: 'Étui et chiffon dans la boîte' } },
] as const;

export type ReceivingKey = (typeof RECEIVING_CHECKS)[number]['key'];

/** Result of the receiving check → which move to make. */
export function receivingOutcome(failed: ReceivingKey[]): 'ready' | 'missing_items' | 'redo' {
  if (!failed.length) return 'ready';
  // Only the box extras missing: chase them, the glasses themselves are fine.
  if (failed.every((k) => k === 'extras')) return 'missing_items';
  return 'redo';
}
