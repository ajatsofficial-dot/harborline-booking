import { getServices } from '@/lib/data';
import ServiceRow from './ServiceRow';

export default async function ServicesPage() {
  const services = await getServices({ activeOnly: false });
  return (
    <main className="wrap admin-main">
      <div className="day-nav">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>Services and prices</h1>
        </div>
      </div>
      <p className="muted" style={{ maxWidth: '62ch' }}>
        Changes apply to the public website and to new bookings straight away. Existing bookings keep the length they were booked with.
        Turn a service off to hide it from online booking.
      </p>
      <section className="panel">
        {services.map((s) => (
          <ServiceRow key={s.id} service={{ id: s.id, name: s.name, code: s.code, price: s.price_cents / 100, duration: s.duration_min, active: Boolean(s.active) }} />
        ))}
      </section>
    </main>
  );
}
