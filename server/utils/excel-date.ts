// server/utils/excel-date.ts

/**
 * Handles conversion of Excel serial numbers or multiple string date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 * to ISO YYYY-MM-DD format safely.
 */
export function parseExcelDate(value: any): string | null {
  if (!value) return null;

  // Handle Javascript Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }

  // Handle Excel Serial Number (e.g. 44197 -> 2021-01-01)
  if (typeof value === 'number') {
    // Excel base date: Dec 30 1899 due to 1900 leap year bug
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // ISO format YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      const parts = trimmed.split('-');
      const y = parseInt(parts[0], 10);
      const m = String(parseInt(parts[1], 10)).padStart(2, '0');
      const d = String(parseInt(parts[2], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Slash format DD/MM/YYYY or MM/DD/YYYY
    const slashParts = trimmed.split(/[\/\.\-]/);
    if (slashParts.length === 3) {
      const p1 = parseInt(slashParts[0], 10);
      const p2 = parseInt(slashParts[1], 10);
      const p3 = parseInt(slashParts[2], 10);

      // If p3 is a 4 digit year
      if (p3 > 1900 && p3 < 2100) {
        // Assume DD/MM/YYYY (standard in MENA/Europe)
        let day = p1;
        let month = p2;
        if (p1 > 12 && p2 <= 12) {
          day = p1;
          month = p2;
        } else if (p2 > 12 && p1 <= 12) {
          // MM/DD/YYYY
          month = p1;
          day = p2;
        }
        return `${p3}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      // If p1 is 4 digit year: YYYY/MM/DD
      if (p1 > 1900 && p1 < 2100) {
        return `${p1}-${String(p2).padStart(2, '0')}-${String(p3).padStart(2, '0')}`;
      }
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  return null;
}
