/**
 * Highest number of bookings that run at the same moment inside [start, end).
 * Concurrency can only rise at `start` or at a booking's own start time,
 * so it is enough to count at those points.
 */
export function peakOverlap(bookings, start, end) {
  const points = [start, ...bookings.map((b) => b.start_min).filter((t) => t > start && t < end)];
  let peak = 0;
  for (const p of points) {
    const n = bookings.filter((b) => b.start_min <= p && b.end_min > p).length;
    if (n > peak) peak = n;
  }
  return peak;
}

/**
 * Start times (minutes after midnight) a service can be booked on a date.
 *
 * @param {object} o
 * @param {string} o.date            'YYYY-MM-DD'
 * @param {{open_min:number|null, close_min:number|null}|undefined} o.hours
 * @param {number} o.duration        service length in minutes
 * @param {number} o.step            slot grid in minutes
 * @param {number} o.chairs          bookings that can run at once
 * @param {{start_min:number,end_min:number}[]} o.bookings  active bookings that day
 * @param {{date:string, minutes:number}} o.now  clinic-local now
 * @param {number} o.minNotice       minutes of notice required for same-day slots
 */
export function computeSlots({ date, hours, duration, step, chairs, bookings, now, minNotice = 0 }) {
  if (!hours || hours.open_min == null || hours.close_min == null) return [];
  if (date < now.date) return [];

  const slots = [];
  for (let s = hours.open_min; s + duration <= hours.close_min; s += step) {
    if (date === now.date && s < now.minutes + minNotice) continue;
    if (peakOverlap(bookings, s, s + duration) < chairs) slots.push(s);
  }
  return slots;
}
