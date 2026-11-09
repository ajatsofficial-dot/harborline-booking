// Dates are stored as 'YYYY-MM-DD' strings and times as minutes after midnight,
// both in the clinic's own time zone. This keeps scheduling free of UTC offsets.

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Current date and minute-of-day in the given IANA time zone. */
export function nowInTz(timeZone, at = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function toUtc(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date, n) {
  const t = toUtc(date);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

export function weekdayOf(date) {
  return toUtc(date).getUTCDay();
}

export function fmtTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function fmtDate(date, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' }).format(toUtc(date));
}

export function fmtMoney(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
