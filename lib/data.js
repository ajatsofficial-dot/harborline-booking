import { conn, rows } from './db.js';
import { computeSlots } from './slots.js';
import { nowInTz, weekdayOf, addDays } from './time.js';

const ACTIVE = "('booked','confirmed')";

export async function getSettings() {
  const s = Object.fromEntries(rows(await (await conn()).execute('SELECT key, value FROM settings')).map((r) => [r.key, r.value]));
  return {
    clinicName: s.clinic_name || 'Harborline Family Dental',
    phone: s.phone || '',
    address: s.address || '',
    timezone: s.timezone || 'America/Los_Angeles',
    chairs: Number(s.chairs || 2),
    step: Number(s.slot_step || 15),
    windowDays: Number(s.booking_window_days || 21),
    minNotice: Number(s.min_notice_min || 120),
  };
}

export async function getServices({ activeOnly = true } = {}) {
  const where = activeOnly ? 'WHERE active = 1' : '';
  return rows(await (await conn()).execute(`SELECT * FROM services ${where} ORDER BY sort, id`));
}

export async function getHours() {
  const list = rows(await (await conn()).execute('SELECT * FROM opening_hours'));
  return Object.fromEntries(list.map((h) => [h.weekday, h]));
}

async function bookingsOn(date, ex) {
  return rows(await (ex ?? (await conn())).execute({
    sql: `SELECT start_min, end_min FROM bookings WHERE date = ? AND status IN ${ACTIVE}`,
    args: [date],
  }));
}

function inWindow(date, settings) {
  const today = nowInTz(settings.timezone).date;
  return date >= today && date <= addDays(today, settings.windowDays - 1);
}

async function slotsFor({ service, date, settings, hours, ex }) {
  if (!inWindow(date, settings)) return [];
  return computeSlots({
    date,
    hours: hours[weekdayOf(date)],
    duration: service.duration_min,
    step: settings.step,
    chairs: settings.chairs,
    bookings: await bookingsOn(date, ex),
    now: nowInTz(settings.timezone),
    minNotice: settings.minNotice,
  });
}

export async function availableSlots(serviceId, date) {
  const [settings, hours, service] = await Promise.all([getSettings(), getHours(), getService(serviceId)]);
  if (!service || !service.active) return [];
  return slotsFor({ service, date, settings, hours });
}

export async function getService(id) {
  const [s] = rows(await (await conn()).execute({ sql: 'SELECT * FROM services WHERE id = ?', args: [id] }));
  return s;
}

/** Days a patient can choose from, with whether the clinic is open. */
export function bookableDays(settings, hours) {
  const today = nowInTz(settings.timezone).date;
  return Array.from({ length: settings.windowDays }, (_, i) => {
    const date = addDays(today, i);
    const h = hours[weekdayOf(date)];
    return { date, open: Boolean(h && h.open_min != null) };
  });
}

/** First few open times for a service, starting today. */
export async function nextOpenings(serviceId, limit = 3) {
  const [settings, hours, service] = await Promise.all([getSettings(), getHours(), getService(serviceId)]);
  if (!service) return [];
  const found = [];
  for (const day of bookableDays(settings, hours)) {
    if (!day.open) continue;
    const slots = await slotsFor({ service, date: day.date, settings, hours });
    for (const start of slots) {
      found.push({ date: day.date, start });
      if (found.length >= limit) return found;
    }
  }
  return found;
}

const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newRef() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'HB-' + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('');
}

/**
 * Create a booking inside a write transaction, re-checking availability so two
 * patients can't take the last chair at the same time.
 */
export async function createBooking(input) {
  const [settings, hours] = await Promise.all([getSettings(), getHours()]);
  // Another booking may hold the write lock for a moment; wait and retry.
  for (let attempt = 0; ; attempt++) {
    try {
      return await tryCreateBooking(input, settings, hours);
    } catch (err) {
      const busy = /SQLITE_BUSY|database is locked/i.test(String(err?.message || err?.code));
      if (!busy || attempt >= 8) throw err;
      await new Promise((r) => setTimeout(r, 40 + Math.random() * 60 * (attempt + 1)));
    }
  }
}

async function tryCreateBooking(input, settings, hours) {
  const tx = await (await conn()).transaction('write');
  try {
    const [service] = rows(await tx.execute({ sql: 'SELECT * FROM services WHERE id = ? AND active = 1', args: [input.serviceId] }));
    if (!service) {
      await tx.rollback();
      return { error: 'That service is no longer available.' };
    }
    const slots = await slotsFor({ service, date: input.date, settings, hours, ex: tx });
    if (!slots.includes(input.start)) {
      await tx.rollback();
      return { error: 'Someone just booked that time. Please choose another slot.' };
    }
    const ref = newRef();
    await tx.execute({
      sql: `INSERT INTO bookings (ref, service_id, date, start_min, end_min, patient_name, phone, email, notes, new_patient)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [ref, service.id, input.date, input.start, input.start + service.duration_min,
        input.name, input.phone, input.email || null, input.notes || null, input.newPatient ? 1 : 0],
    });
    await tx.commit();
    return { ref };
  } catch (err) {
    try { await tx.rollback(); } catch {}
    throw err;
  } finally {
    tx.close();
  }
}

export async function getBookingByRef(ref) {
  const [b] = rows(await (await conn()).execute({
    sql: `SELECT b.*, s.name AS service_name, s.duration_min FROM bookings b
          JOIN services s ON s.id = b.service_id WHERE b.ref = ?`,
    args: [ref],
  }));
  return b;
}

// ---------- Admin ----------

export async function bookingsForDate(date) {
  return rows(await (await conn()).execute({
    sql: `SELECT b.*, s.name AS service_name FROM bookings b
          JOIN services s ON s.id = b.service_id
          WHERE b.date = ? ORDER BY b.start_min, b.id`,
    args: [date],
  }));
}

export async function loadByDay(fromDate, days) {
  const to = addDays(fromDate, days - 1);
  const counts = Object.fromEntries(rows(await (await conn()).execute({
    sql: `SELECT date, COUNT(*) AS n FROM bookings WHERE date BETWEEN ? AND ? AND status IN ${ACTIVE} GROUP BY date`,
    args: [fromDate, to],
  })).map((r) => [r.date, Number(r.n)]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(fromDate, i);
    return { date, count: counts[date] || 0 };
  });
}

export const STATUSES = ['booked', 'confirmed', 'completed', 'cancelled', 'no_show'];

export async function setBookingStatus(id, status) {
  if (!STATUSES.includes(status)) throw new Error('Unknown status');
  await (await conn()).execute({ sql: 'UPDATE bookings SET status = ? WHERE id = ?', args: [status, id] });
}

export async function updateService(id, { priceCents, durationMin, active }) {
  await (await conn()).execute({
    sql: 'UPDATE services SET price_cents = ?, duration_min = ?, active = ? WHERE id = ?',
    args: [priceCents, durationMin, active ? 1 : 0, id],
  });
}

export async function bookingsBetween(from, to) {
  return rows(await (await conn()).execute({
    sql: `SELECT b.ref, b.date, b.start_min, b.end_min, s.name AS service, b.patient_name, b.phone, b.email,
                 b.new_patient, b.status, b.notes, b.created_at
          FROM bookings b JOIN services s ON s.id = b.service_id
          WHERE b.date BETWEEN ? AND ? ORDER BY b.date, b.start_min`,
    args: [from, to],
  }));
}
