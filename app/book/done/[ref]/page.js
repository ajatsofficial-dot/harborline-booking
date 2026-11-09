import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingByRef, getSettings } from '@/lib/data';
import { fmtDate, fmtTime } from '@/lib/time';
import { SiteHeader, SiteFooter } from '../../../components';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Booking confirmed', robots: { index: false } };

export default async function Done({ params }) {
  const [booking, settings] = await Promise.all([getBookingByRef(params.ref), getSettings()]);
  if (!booking) notFound();
  const firstName = booking.patient_name.split(' ')[0];

  return (
    <>
      <SiteHeader clinicName={settings.clinicName} showNav={false} />
      <main className="wrap">
        <div className="ticket">
          <div className="ticket-top">
            <span className="eyebrow">Booking received</span>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>See you soon, {firstName}.</h1>
          </div>
          <div className="ticket-body">
            <dl>
              <dt>Reference</dt><dd className="ref">{booking.ref}</dd>
              <dt>Service</dt><dd>{booking.service_name}</dd>
              <dt>Date</dt><dd>{fmtDate(booking.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</dd>
              <dt>Time</dt><dd className="mono">{fmtTime(booking.start_min)} – {fmtTime(booking.end_min)}</dd>
              <dt>Where</dt><dd>{settings.address}</dd>
            </dl>
            <p className="muted">The front desk will confirm by text within one business day. To change or cancel, call <span className="mono">{settings.phone}</span> and quote your reference.</p>
            <div className="ticket-actions">
              <a className="btn btn-primary" href={`/book/done/${booking.ref}/calendar`}>Add to calendar</a>
              <Link className="btn btn-quiet" href="/">Back to home</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
