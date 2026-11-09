import { getSettings, getServices, getHours, bookableDays } from '@/lib/data';
import { SiteHeader, SiteFooter } from '../components';
import BookingFlow from './BookingFlow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Book an appointment' };

export default async function BookPage({ searchParams }) {
  const [settings, services, hours] = await Promise.all([getSettings(), getServices(), getHours()]);
  const days = bookableDays(settings, hours);

  const wanted = Number(searchParams.service);
  const initialService = services.some((s) => s.id === wanted) ? wanted : null;
  const initialDate = days.some((d) => d.date === searchParams.date && d.open) ? searchParams.date : null;
  const initialStart = initialDate && /^\d+$/.test(searchParams.start || '') ? Number(searchParams.start) : null;

  return (
    <>
      <SiteHeader clinicName={settings.clinicName} showNav={false} />
      <main className="wrap book-page">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="eyebrow">Book online</span>
          <h1 style={{ fontSize: 'clamp(2rem, 4.4vw, 3rem)' }}>Book your visit</h1>
          <p>Times update live from our schedule. Your slot is held as soon as you submit.</p>
        </div>
        <BookingFlow
          services={services.map(({ id, name, duration_min, price_cents, description }) => ({ id, name, duration_min, price_cents, description }))}
          days={days}
          initialService={initialService}
          initialDate={initialDate}
          initialStart={initialStart}
          phone={settings.phone}
        />
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
