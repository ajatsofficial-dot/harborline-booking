import Link from 'next/link';
import { bookingsForDate, getSettings, getHours, loadByDay, STATUSES } from '@/lib/data';
import { addDays, DATE_RE, fmtDate, fmtTime, nowInTz, weekdayOf } from '@/lib/time';
import { updateStatusAction } from '../actions';

const LABEL = { booked: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };

export default async function Schedule({ searchParams }) {
  const settings = await getSettings();
  const today = nowInTz(settings.timezone).date;
  const date = DATE_RE.test(searchParams.date || '') ? searchParams.date : today;
  const [bookings, hours, week] = await Promise.all([bookingsForDate(date), getHours(), loadByDay(today, 7)]);

  const active = bookings.filter((b) => b.status === 'booked' || b.status === 'confirmed');
  const h = hours[weekdayOf(date)];
  const openMinutes = h && h.open_min != null ? (h.close_min - h.open_min) * settings.chairs : 0;
  const bookedMinutes = active.reduce((sum, b) => sum + (b.end_min - b.start_min), 0);
  const utilization = openMinutes ? Math.round((bookedMinutes / openMinutes) * 100) : 0;
  const maxWeek = Math.max(4, ...week.map((d) => d.count));

  return (
    <main className="wrap admin-main">
      <div className="day-nav">
        <div>
          <span className="eyebrow">{date === today ? 'Today' : 'Schedule'}</span>
          <h1>{fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
        </div>
        <div className="controls">
          <Link className="btn btn-quiet btn-sm" href={`/admin?date=${addDays(date, -1)}`}>← Previous</Link>
          <Link className="btn btn-quiet btn-sm" href="/admin">Today</Link>
          <Link className="btn btn-quiet btn-sm" href={`/admin?date=${addDays(date, 1)}`}>Next →</Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>{active.length}</b><span>Appointments</span></div>
        <div className="stat"><b>{bookings.filter((b) => b.status === 'booked').length}</b><span>Waiting for confirmation</span></div>
        <div className="stat"><b>{active.filter((b) => b.new_patient).length}</b><span>New patients</span></div>
        <div className="stat"><b>{h && h.open_min != null ? `${utilization}%` : 'Closed'}</b><span>Chair time booked ({settings.chairs} chairs)</span></div>
      </div>

      <nav className="week" aria-label="Next 7 days">
        {week.map((d) => (
          <Link key={d.date} href={`/admin?date=${d.date}`} aria-current={d.date === date ? 'date' : undefined}>
            <small>{d.date === today ? 'Today' : fmtDate(d.date, { weekday: 'short', day: 'numeric' })}</small>
            <span className="bar"><i style={{ width: `${Math.round((d.count / maxWeek) * 100)}%` }} /></span>
            <span className="n">{d.count} booked</span>
          </Link>
        ))}
      </nav>

      <section className="panel" aria-labelledby="agenda">
        <div className="panel-head">
          <h2 id="agenda" style={{ fontSize: '1.1rem' }}>Agenda</h2>
          <span className="muted" style={{ fontSize: '.9rem' }}>
            {h && h.open_min != null ? `Open ${fmtTime(h.open_min)} – ${fmtTime(h.close_min)}` : 'Clinic closed'}
          </span>
        </div>
        {bookings.length === 0 ? (
          <p style={{ padding: 18 }} className="muted">No bookings on this day yet. New online bookings appear here as soon as patients submit them.</p>
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead><tr><th>Time</th><th>Patient</th><th>Service</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className={b.status === 'cancelled' || b.status === 'no_show' ? 'dim' : undefined}>
                    <td className="time">{fmtTime(b.start_min)}<br /><span className="muted">{fmtTime(b.end_min)}</span></td>
                    <td>
                      <div className="who">
                        <span>{b.patient_name}{b.new_patient ? <span className="badge">1st visit</span> : null}</span>
                        <small>{b.phone} · {b.ref}</small>
                        {b.notes ? <small>{b.notes}</small> : null}
                      </div>
                    </td>
                    <td>{b.service_name}</td>
                    <td><span className={`pill ${b.status}`}>{LABEL[b.status]}</span></td>
                    <td>
                      <form action={updateStatusAction} className="status-form">
                        <input type="hidden" name="id" value={b.id} />
                        <label className="sr-only" htmlFor={`st-${b.id}`}>Status for {b.patient_name}</label>
                        <select id={`st-${b.id}`} name="status" defaultValue={b.status}>
                          {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                        </select>
                        <button className="btn btn-quiet btn-sm" type="submit">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
