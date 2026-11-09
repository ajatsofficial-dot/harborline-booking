import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSlots, peakOverlap } from '../lib/slots.js';
import { addDays, weekdayOf, fmtTime } from '../lib/time.js';

const base = {
  date: '2026-11-17',
  hours: { open_min: 540, close_min: 660 }, // 9:00–11:00
  duration: 60,
  step: 30,
  chairs: 1,
  bookings: [],
  now: { date: '2026-11-16', minutes: 600 },
  minNotice: 120,
};

test('empty day offers every slot that fits before closing', () => {
  assert.deepEqual(computeSlots(base), [540, 570, 600]);
});

test('closed day offers nothing', () => {
  assert.deepEqual(computeSlots({ ...base, hours: { open_min: null, close_min: null } }), []);
  assert.deepEqual(computeSlots({ ...base, hours: undefined }), []);
});

test('past dates offer nothing', () => {
  assert.deepEqual(computeSlots({ ...base, date: '2026-11-15' }), []);
});

test('same-day slots respect minimum notice', () => {
  const today = { ...base, date: '2026-11-16', now: { date: '2026-11-16', minutes: 450 } }; // 7:30, 2h notice
  assert.deepEqual(computeSlots(today), [570, 600]);
});

test('one chair: an overlapping booking blocks the slot', () => {
  const slots = computeSlots({ ...base, bookings: [{ start_min: 570, end_min: 630 }] });
  assert.deepEqual(slots, []); // 540–600, 570–630 and 600–660 all overlap 570–630
});

test('two chairs: one booking leaves room for a second patient', () => {
  const slots = computeSlots({ ...base, chairs: 2, bookings: [{ start_min: 570, end_min: 630 }] });
  assert.deepEqual(slots, [540, 570, 600]);
});

test('two non-overlapping bookings do not count as a double booking', () => {
  // Both bookings touch 540–660, but never at the same moment, so one chair is always free.
  const bookings = [{ start_min: 540, end_min: 570 }, { start_min: 600, end_min: 630 }];
  assert.equal(peakOverlap(bookings, 540, 660), 1);
  assert.deepEqual(computeSlots({ ...base, duration: 120, chairs: 2, bookings }), [540]);
});

test('date helpers handle month ends and weekdays', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(weekdayOf('2026-11-09'), 1); // Monday
  assert.equal(fmtTime(450), '7:30 AM');
  assert.equal(fmtTime(780), '1:00 PM');
  assert.equal(fmtTime(0), '12:00 AM');
});
