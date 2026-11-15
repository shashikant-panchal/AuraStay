/**
 * Canonical Admin Room & Category Ordering Helpers
 * Enforces predictable hierarchy across all PMS views & selectors:
 *   1. Standard
 *   2. Deluxe
 *   3. Executive
 *   4. Suites / Villas / Other custom categories
 * And natural numeric room number ordering within each category.
 */

export function getCategorySortRank(categoryName = '') {
  const lower = String(categoryName || '').trim().toLowerCase();
  if (!lower) return 999;
  if (lower.includes('standard') || lower === 'std') return 1;
  if (lower.includes('super deluxe') || lower.includes('super delux')) return 2.5;
  if (lower.includes('deluxe') || lower.includes('delux') || lower === 'dlx') return 2;
  if (lower.includes('executive') || lower.includes('exec')) return 3;
  if (lower.includes('suite')) return 4;
  if (lower.includes('villa') || lower.includes('cottage')) return 5;
  return 100;
}

export function compareCategoryNames(a = '', b = '') {
  const nameA = typeof a === 'object' ? (a?.name || a?.category || a?.type || '') : a;
  const nameB = typeof b === 'object' ? (b?.name || b?.category || b?.type || '') : b;
  const rankA = getCategorySortRank(nameA);
  const rankB = getCategorySortRank(nameB);
  if (rankA !== rankB) return rankA - rankB;
  return String(nameA || '').localeCompare(String(nameB || ''), undefined, { sensitivity: 'base' });
}

export function compareRoomNumbers(a = '', b = '') {
  const numA = String(a?.roomNumber ?? a?.room_number ?? a?.id ?? a ?? '').trim();
  const numB = String(b?.roomNumber ?? b?.room_number ?? b?.id ?? b ?? '').trim();
  return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
}

export function compareRoomsByCategoryAndNumber(a = {}, b = {}) {
  const catA = a?.type || a?.category || a?.roomType || '';
  const catB = b?.type || b?.category || b?.roomType || '';
  const catDiff = compareCategoryNames(catA, catB);
  if (catDiff !== 0) return catDiff;
  return compareRoomNumbers(a, b);
}
