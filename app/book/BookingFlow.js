'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createBookingAction } from './actions';
import { fmtDate, fmtMoney, fmtTime } from '@/lib/time';

function SubmitButton({ ready }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={!ready || pending}>
      {pending ? 'Booking…' : 'Confirm booking'}
    </button>
  );
}

export default function BookingFlow({ services, days, initialService, initialDate, initialStart, phone }) {
  const firstOpen = days.find((d) => d.open)?.date ?? null;
  const [serviceId, setServiceId] = useState(initialService ?? services[0]?.id ?? null);
  const [date, setDate] = useState(initialDate ?? firstOpen);
  const [start, setStart] = useState(initialStart);
  const [slots, setSlots] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [state, formAction] = useFormState(createBookingAction, null);

  const service = services.find((s) => s.id === serviceId);

  useEffect(() => {
    if (!serviceId || !date) return;
    let cancelled = false;
    setSlots(null);
    setLoadError('');
    fetch(`/api/slots?service=${serviceId}&date=${date}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Bad response'))))
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots);
        setStart((prev) => (data.slots.some((s) => s.start === prev) ? prev : null));
      })
      .catch(() => !cancelled && setLoadError('Could not load times. Check your connection and try again.'));
    return () => { cancelled = true; };
  }, [serviceId, date, state?.refresh]);

  const ready = Boolean(serviceId && date && start != null);

  return (
    <div className="book-grid">
      <form action={formAction} noValidate>
        <input type="hidden" name="serviceId" value={serviceId ?? ''} />
        <input type="hidden" name="date" value={date ?? ''} />
        <input type="hidden" name="start" value={start ?? ''} />

        <section className="stage" aria-labelledby="st-1">
          <div className="stage-title"><span className="num">01</span><h2 id="st-1" style={{ fontSize: '1.3rem' }}>What do you need?</h2></div>
          <div className="service-pick">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                className="choice"
                aria-pressed={s.id === serviceId}
                onClick={() => setServiceId(s.id)}
              >
                <strong>{s.name}</strong>
                <span className="meta">{s.duration_min} min · {fmtMoney(s.price_cents)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="stage" aria-labelledby="st-2">
          <div className="stage-title"><span className="num">02</span><h2 id="st-2" style={{ fontSize: '1.3rem' }}>Pick a day and time</h2></div>
          <div className="day-strip" role="group" aria-label="Choose a day">
            {days.map((d) => (
              <button
                key={d.date}
                type="button"
                className="day"
                disabled={!d.open}
                aria-pressed={d.date === date}
                aria-label={fmtDate(d.date, { weekday: 'long', month: 'long', day: 'numeric' }) + (d.open ? '' : ', closed')}
                onClick={() => setDate(d.date)}
              >
                <small>{fmtDate(d.date, { weekday: 'short' })}</small>
                <b>{fmtDate(d.date, { day: 'numeric' })}</b>
                <small>{fmtDate(d.date, { month: 'short' })}</small>
              </button>
            ))}
          </div>
          <div aria-live="polite">
            {loadError ? (
              <p className="error">{loadError}</p>
            ) : slots === null ? (
              <p className="muted">Loading open times…</p>
            ) : slots.length === 0 ? (
              <p className="empty">No open times for this service on {fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}. Try another day.</p>
            ) : (
              <div className="slot-grid" role="group" aria-label="Choose a time">
                {slots.map((s) => (
                  <button key={s.start} type="button" className="slot" aria-pressed={s.start === start} onClick={() => setStart(s.start)}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {state?.field === 'start' && <p className="error" role="alert">{state.error}</p>}
        </section>

        <section className="stage" aria-labelledby="st-3">
          <div className="stage-title"><span className="num">03</span><h2 id="st-3" style={{ fontSize: '1.3rem' }}>Your details</h2></div>
          <div className="field-grid">
            <label className="field">Full name<input name="name" type="text" autoComplete="name" required aria-invalid={state?.field === 'name'} /></label>
            <label className="field">Mobile number<input name="phone" type="tel" autoComplete="tel" required aria-invalid={state?.field === 'phone'} /></label>
          </div>
          <label className="field">Email <span className="hint">Optional. For your booking confirmation.</span><input name="email" type="email" autoComplete="email" aria-invalid={state?.field === 'email'} /></label>
          <label className="field">Anything we should know? <span className="hint">Optional</span><textarea name="notes" maxLength={500} /></label>
          <label className="check"><input type="checkbox" name="newPatient" /> This is my first visit to Harborline</label>
          <label className="hp" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
          {state?.error && state.field !== 'start' && <p className="error" role="alert">{state.error}</p>}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <SubmitButton ready={ready} />
            {!ready && <span className="muted">Choose a service, day and time first.</span>}
          </div>
        </section>
      </form>

      <aside className="summary" aria-label="Booking summary">
        <span className="eyebrow">Your booking</span>
        <dl>
          <div><dt>Service</dt><dd>{service ? service.name : '—'}</dd></div>
          <div><dt>When</dt><dd>{date && start != null ? `${fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}, ${fmtTime(start)}` : '—'}</dd></div>
          <div><dt>Length</dt><dd>{service ? `${service.duration_min} minutes` : '—'}</dd></div>
          <div><dt>Self-pay price</dt><dd>{service ? fmtMoney(service.price_cents) : '—'}</dd></div>
        </dl>
        <p className="muted" style={{ fontSize: '.9rem' }}>Have insurance? We bill most PPO plans and confirm your share before the visit. Questions: <span className="mono">{phone}</span></p>
      </aside>
    </div>
  );
}
