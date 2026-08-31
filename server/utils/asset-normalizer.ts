// server/utils/asset-normalizer.ts

/**
 * Normalizes asset numbers according to organization standardization rules:
 * E.g. "SYR \ ALP \ 492" or "SYR /ALP /492" or "SYR-ALP-492" -> "SYR/ALP/492"
 */
export function normalizeAssetNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .trim()
    .toUpperCase()
    // Replace backslashes, dashes, dots, underscores, multiple spaces with forward slash
    .replace(/[\\/_\-\.]+/g, '/')
    // Remove whitespace around slashes
    .replace(/\s*\/\s*/g, '/')
    // Remove leading and trailing slashes
    .replace(/^\/+|\/+$/g, '')
    // Collapse multiple internal spaces
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes lifecycle status string
 */
export function normalizeLifecycleStatus(status: string | null | undefined): string {
  if (!status) return 'CURRENTLY_HELD';
  const clean = status.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const valid = ['CURRENTLY_HELD', 'DISPOSED', 'MISSING', 'TRANSFERRED', 'UNKNOWN'];
  if (valid.includes(clean)) return clean;
  if (clean.includes('STOCK') || clean.includes('HELD') || clean.includes('ACTIVE') || clean.includes('IN_USE')) return 'CURRENTLY_HELD';
  if (clean.includes('DISPOSE') || clean.includes('SOLD') || clean.includes('SCRAP')) return 'DISPOSED';
  if (clean.includes('MISS') || clean.includes('LOST')) return 'MISSING';
  if (clean.includes('TRANS')) return 'TRANSFERRED';
  return 'UNKNOWN';
}

/**
 * Normalizes condition status string
 */
export function normalizeConditionStatus(condition: string | null | undefined): string {
  if (!condition) return 'OK';
  const clean = condition.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const valid = ['OK', 'DAMAGED', 'NEEDS_REPAIR', 'UNSERVICEABLE', 'LOST', 'UNKNOWN'];
  if (valid.includes(clean)) return clean;
  if (clean.includes('GOOD') || clean.includes('NEW') || clean.includes('OK') || clean.includes('EXCELLENT')) return 'OK';
  if (clean.includes('REPAIR') || clean.includes('MAINT')) return 'NEEDS_REPAIR';
  if (clean.includes('DAMAG')) return 'DAMAGED';
  if (clean.includes('UNSERV') || clean.includes('DEAD') || clean.includes('SCRAP')) return 'UNSERVICEABLE';
  if (clean.includes('LOST') || clean.includes('MISS')) return 'LOST';
  return 'UNKNOWN';
}
