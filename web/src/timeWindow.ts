// Parses ACNH time strings into hour ranges [startHour, endHour) on a 24h clock.
// Handles: "All day", "4 a.m. - 7 p.m.", multi-range "A - B, C - D", and a few typos.

export type Range = { start: number; end: number }; // end may be <= start to mean "wraps midnight"

const HOUR_RE = /(\d{1,2})\s*(a|p)\s*\.?\s*m\s*\.?/i;

function parseHour(token: string): number | null {
  const m = token.match(HOUR_RE);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const isPM = m[2].toLowerCase() === 'p';
  if (h === 12) h = 0;
  if (isPM) h += 12;
  return h;
}

export function parseTime(time: string): Range[] | 'all' {
  const trimmed = time.trim();
  if (/^all\s*day$/i.test(trimmed)) return 'all';

  // Split on commas or "and"/"&" to support multi-range strings.
  const segments = trimmed.split(/\s*(?:,|&|\band\b)\s*/i);
  const ranges: Range[] = [];
  for (const seg of segments) {
    const parts = seg.split(/\s*[-–—]\s*/);
    if (parts.length !== 2) continue;
    const start = parseHour(parts[0]);
    const end = parseHour(parts[1]);
    if (start === null || end === null) continue;
    ranges.push({ start, end });
  }
  return ranges;
}

export function isActiveNow(time: string, now: Date = new Date()): boolean {
  const parsed = parseTime(time);
  if (parsed === 'all') return true;
  const h = now.getHours();
  for (const { start, end } of parsed) {
    if (start === end) return true; // treat as all-day
    if (start < end) {
      if (h >= start && h < end) return true;
    } else {
      // wraps midnight: active if h >= start OR h < end
      if (h >= start || h < end) return true;
    }
  }
  return false;
}
