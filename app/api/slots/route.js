import { NextResponse } from 'next/server';
import { availableSlots } from '@/lib/data';
import { DATE_RE, fmtTime } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const service = Number(searchParams.get('service'));
  const date = searchParams.get('date') || '';
  if (!Number.isInteger(service) || service <= 0 || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Pass a service id and a date (YYYY-MM-DD).' }, { status: 400 });
  }
  const slots = await availableSlots(service, date);
  return NextResponse.json(
    { date, slots: slots.map((start) => ({ start, label: fmtTime(start) })) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
