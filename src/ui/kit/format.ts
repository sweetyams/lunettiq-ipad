/** "+15145550104" → "514-555-0104"; other formats pass through. */
export function formatPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, '');
  const local = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (local.length === 10) return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  return raw;
}
