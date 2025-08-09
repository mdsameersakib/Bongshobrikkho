// Date utility functions centralizing formatting & recurring event helpers
// All dates stored as YYYY-MM-DD (UTC naive). We treat them as local dates.

export function parseISODate(dateStr) {
  if (!dateStr) return null;
  // Force T00:00:00 local to avoid timezone shift
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateDMY(dateStr) {
  const d = parseISODate(dateStr);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// For annual recurring events (birthday, anniversary)
export function nextOccurrence(dateStr, fromDate = new Date()) {
  const base = parseISODate(dateStr);
  if (!base) return null;
  const today = new Date(fromDate);
  today.setHours(0,0,0,0);
  const next = new Date(base);
  next.setFullYear(today.getFullYear());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return next;
}

export function yearsSince(dateStr, refDate = new Date()) {
  const base = parseISODate(dateStr);
  if (!base) return null;
  const y = refDate.getFullYear() - base.getFullYear();
  return y >= 0 ? y : 0;
}
