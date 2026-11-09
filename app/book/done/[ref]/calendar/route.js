import { getBookingByRef, getSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

const pad = (n) => String(n).padStart(2, '0');
const stamp = (date, min) => `${date.replace(/-/g, '')}T${pad(Math.floor(min / 60))}${pad(min % 60)}00`;
const esc = (s) => String(s).replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/** iCalendar file so patients can add the visit to any calendar app. */
export async function GET(_request, { params }) {
  const [b, settings] = await Promise.all([getBookingByRef(params.ref), getSettings()]);
  if (!b) return new Response('Not found', { status: 404 });
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Harborline Family Dental//Booking//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${b.ref}@harborline-booking`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=${settings.timezone}:${stamp(b.date, b.start_min)}`,
    `DTEND;TZID=${settings.timezone}:${stamp(b.date, b.end_min)}`,
    `SUMMARY:${esc(`${b.service_name} at ${settings.clinicName}`)}`,
    `LOCATION:${esc(settings.address)}`,
    `DESCRIPTION:${esc(`Booking reference ${b.ref}. To change or cancel call ${settings.phone}.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="harborline-${b.ref}.ics"`,
    },
  });
}
