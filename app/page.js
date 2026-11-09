import Link from 'next/link';
import { getSettings, getServices, getHours, nextOpenings } from '@/lib/data';
import { fmtDate, fmtTime, fmtMoney, nowInTz, weekdayOf } from '@/lib/time';
import { SiteHeader, SiteFooter } from './components';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function Home() {
  const [settings, services, hours] = await Promise.all([getSettings(), getServices(), getHours()]);
  const featured = services.find((s) => s.slug === 'exam-cleaning') || services[0];
  const openings = featured ? await nextOpenings(featured.id, 4) : [];
  const now = nowInTz(settings.timezone);
  const todayWd = weekdayOf(now.date);

  return (
    <>
      <SiteHeader clinicName={settings.clinicName} />
      <main>
        <div className="wrap hero">
          <div className="hero-copy">
            <span className="eyebrow">Family dentist · North Tacoma, WA</span>
            <h1>See a real open time. Book it in under a minute.</h1>
            <p className="lede">
              Cleanings, fillings and kids' visits with Saturday hours, and a written cost estimate before any treatment starts.
            </p>
            <div className="hero-actions">
              <Link href="/book" className="btn btn-primary">Book an appointment</Link>
              <span className="phone">{settings.phone}</span>
            </div>
          </div>

          <aside className="open-now" aria-labelledby="open-title">
            <header>
              <h2 id="open-title" style={{ fontSize: '1.15rem' }}>Next openings</h2>
              <span className="live">Live from our schedule</span>
            </header>
            {openings.length === 0 ? (
              <p className="empty">No open times in the next three weeks. Please call us.</p>
            ) : (
              openings.map((o) => (
                <Link
                  key={`${o.date}-${o.start}`}
                  className="opening"
                  href={`/book?service=${featured.id}&date=${o.date}&start=${o.start}`}
                >
                  <span className="t">{fmtTime(o.start)}</span>
                  <span className="d">{o.date === now.date ? 'Today' : fmtDate(o.date, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  <span className="go" aria-hidden="true">Book →</span>
                </Link>
              ))
            )}
            <footer>Showing {featured?.name.toLowerCase()} times. Other services on the booking page.</footer>
          </aside>
        </div>

        <div className="wrap">
          <div className="facts">
            <div><strong>Saturdays</strong><span>8:00 am to 1:00 pm</span></div>
            <div><strong>Same-day</strong><span>Emergency visits</span></div>
            <div><strong>Most PPO plans</strong><span>Billed directly</span></div>
            <div><strong>Kids from age 1</strong><span>Parents stay in the room</span></div>
          </div>
        </div>

        <section className="section" id="services">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Services and prices</span>
              <h2>Know the time and the price before you come in.</h2>
              <p>Self-pay prices shown. Codes are the ones your insurer sees on the claim, so you can check coverage first.</p>
            </div>
            <div className="service-list">
              {services.map((s) => (
                <div className="service-row" key={s.id}>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <span className="code">CDT {s.code}</span>
                  <span className="len">{s.duration_min} min</span>
                  <span className="price">{fmtMoney(s.price_cents)}</span>
                  <Link className="book-link btn btn-quiet btn-sm" href={`/book?service=${s.id}`} aria-label={`Book ${s.name}`}>Book</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section visit" id="first-visit">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Your first visit</span>
              <h2>The plan and the price, before anything starts.</h2>
            </div>
            <ol className="steps">
              <li><h3>Book online</h3><p>Pick a real open time. You get a booking reference straight away.</p></li>
              <li><h3>We confirm</h3><p>The front desk confirms by text and sends forms to fill on your phone.</p></li>
              <li><h3>Exam and X-rays</h3><p>About 90 minutes, with your X-rays on screen as we explain them.</p></li>
              <li><h3>Written plan</h3><p>Every treatment listed with what insurance pays and what you pay.</p></li>
            </ol>
          </div>
        </section>

        <section className="section" id="hours">
          <div className="wrap info-grid">
            <div>
              <div className="section-head"><span className="eyebrow">Hours</span><h2>Open six days a week.</h2></div>
              <table className="hours-table">
                <tbody>
                  {ORDER.map((wd) => {
                    const h = hours[wd];
                    const open = h && h.open_min != null;
                    return (
                      <tr key={wd} className={wd === todayWd ? 'today' : undefined}>
                        <td>{DAYS[wd]}{wd === todayWd ? ' (today)' : ''}</td>
                        <td>{open ? `${fmtTime(h.open_min)} – ${fmtTime(h.close_min)}` : 'Closed'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="muted" style={{ marginTop: 16 }}>{settings.address}</p>
            </div>
            <div>
              <div className="section-head"><span className="eyebrow">Questions</span><h2>Before you come in</h2></div>
              <div className="faq">
                <details><summary>How fast will my booking be confirmed?</summary><p>Online bookings are held right away. The front desk confirms by text within one business day.</p></details>
                <details><summary>Can I change or cancel?</summary><p>Call or text us at least 24 hours ahead and quote your booking reference.</p></details>
                <details><summary>Do you see children?</summary><p>Yes, from age one. Parents are welcome in the room for the whole visit.</p></details>
                <details><summary>I have a toothache today.</summary><p>Book an emergency visit online, or call before 11 am and we will fit you in.</p></details>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
