// Creates tables and starter data. Runs automatically on the first request,
// so a fresh deployment needs no manual database step.
import { nowInTz, addDays, weekdayOf } from './time.js';

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min BETWEEN 15 AND 240),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  code TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS opening_hours (
  weekday INTEGER PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  open_min INTEGER,
  close_min INTEGER
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  service_id INTEGER NOT NULL REFERENCES services(id),
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  new_patient INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked','confirmed','completed','cancelled','no_show')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS bookings_by_date ON bookings (date, start_min);
`;

const TZ = 'America/Los_Angeles';

const SETTINGS = {
  clinic_name: 'Harborline Family Dental',
  phone: '(253) 555-0148',
  address: '2140 N Alder Ave, Suite 3, Tacoma, WA 98406',
  timezone: TZ,
  chairs: '2',
  slot_step: '15',
  booking_window_days: '21',
  min_notice_min: '120',
};

const SERVICES = [
  ['new-patient', 'New patient visit', 'Comprehensive exam, full-mouth X-rays and a cleaning, with a written treatment plan.', 90, 18900, 'D0150 · D0210 · D1110'],
  ['exam-cleaning', 'Exam and cleaning', 'Routine check-up, cleaning and polish for existing patients.', 60, 14900, 'D0120 · D1110'],
  ['kids-visit', "Kids' visit", 'Gentle exam, cleaning and fluoride varnish for children.', 45, 9900, 'D0120 · D1120 · D1206'],
  ['filling', 'Tooth-colored filling', 'Composite filling matched to your tooth, finished in one visit.', 45, 21500, 'D2391'],
  ['crown-consult', 'Crown consultation', 'Assessment and scan for a cracked or heavily filled tooth.', 30, 7500, 'D0140'],
  ['emergency', 'Emergency visit', 'Toothache, broken tooth or lost filling. Same-day when available.', 30, 9500, 'D0140'],
];

// Minutes after midnight per weekday (0 = Sunday). null = closed.
const HOURS = { 0: [null, null], 1: [450, 1020], 2: [450, 1020], 3: [540, 1110], 4: [450, 1020], 5: [450, 840], 6: [480, 780] };

const SAMPLE_NAMES = ['Maria Lopez', 'James Chen', 'Aisha Patel', 'Tom Becker', 'Grace Kim', 'Luis Ortega', 'Hannah Moore', 'Sam Okafor', 'Nora Lindqvist', 'Ben Walsh'];

export async function setupDatabase(client, { reset = false, samples = process.env.DEMO_MODE === 'true' } = {}) {
  if (reset) {
    await client.executeMultiple('DROP TABLE IF EXISTS bookings; DROP TABLE IF EXISTS services; DROP TABLE IF EXISTS opening_hours; DROP TABLE IF EXISTS settings;');
  }
  await client.executeMultiple(SCHEMA);

  const count = Number((await client.execute('SELECT COUNT(*) FROM services')).rows[0][0]);
  if (count > 0) return { seeded: false };

  const stmts = [];
  for (const [k, v] of Object.entries(SETTINGS)) stmts.push({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', args: [k, v] });
  SERVICES.forEach(([slug, name, description, duration, price, code], i) =>
    stmts.push({
      sql: 'INSERT OR IGNORE INTO services (slug, name, description, duration_min, price_cents, code, sort) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [slug, name, description, duration, price, code, i],
    }));
  for (const [day, [open, close]] of Object.entries(HOURS))
    stmts.push({ sql: 'INSERT OR IGNORE INTO opening_hours (weekday, open_min, close_min) VALUES (?, ?, ?)', args: [Number(day), open, close] });
  await client.batch(stmts, 'write');

  let sampleCount = 0;
  if (samples) {
    const svc = (await client.execute('SELECT id, duration_min FROM services ORDER BY sort')).rows;
    const today = nowInTz(TZ).date;
    const inserts = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(today, d);
      const [open, close] = HOURS[weekdayOf(date)];
      if (open == null) continue;
      for (let start = open + 30, k = 0; start + 90 <= close && k < 4; start += 105, k++) {
        const n = inserts.length;
        const s = svc[n % svc.length];
        inserts.push({
          sql: `INSERT OR IGNORE INTO bookings (ref, service_id, date, start_min, end_min, patient_name, phone, notes, new_patient, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [`HB-SAMPLE${String(n).padStart(2, '0')}`, s[0], date, start, start + Number(s[1]), SAMPLE_NAMES[n % SAMPLE_NAMES.length],
            `(253) 555-01${String(10 + n).slice(-2)}`, 'Sample booking', n % 3 === 0 ? 1 : 0, k % 2 ? 'confirmed' : 'booked'],
        });
      }
    }
    await client.batch(inserts, 'write');
    sampleCount = inserts.length;
  }
  return { seeded: true, services: SERVICES.length, samples: sampleCount };
}
