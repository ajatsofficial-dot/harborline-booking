import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { bookingsBetween, getSettings } from '@/lib/data';
import { addDays, fmtTime, nowInTz } from '@/lib/time';

export const dynamic = 'force-dynamic';

const cell = (v) => {
  const s = v == null ? '' : String(v);
  // Quote every cell; neutralise leading characters spreadsheets treat as formulas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** CSV of bookings from 30 days ago to 60 days ahead, for spreadsheets or the practice system. */
export async function GET() {
  if (!(await verifySessionToken(cookies().get(SESSION_COOKIE)?.value))) {
    return new Response('Sign in first.', { status: 401 });
  }
  const { timezone } = await getSettings();
  const today = nowInTz(timezone).date;
  const list = await bookingsBetween(addDays(today, -30), addDays(today, 60));
  const header = ['Reference', 'Date', 'Start', 'End', 'Service', 'Patient', 'Phone', 'Email', 'New patient', 'Status', 'Notes', 'Booked at (UTC)'];
  const lines = [header, ...list.map((b) => [
    b.ref, b.date, fmtTime(b.start_min), fmtTime(b.end_min), b.service, b.patient_name, b.phone, b.email,
    b.new_patient ? 'Yes' : 'No', b.status, b.notes, b.created_at,
  ])].map((r) => r.map(cell).join(','));
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="harborline-bookings-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
