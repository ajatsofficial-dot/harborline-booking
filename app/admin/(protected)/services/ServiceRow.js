'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateServiceAction } from '../../actions';

function Save() {
  const { pending } = useFormStatus();
  return <button className="btn btn-quiet btn-sm" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}

export default function ServiceRow({ service }) {
  const [state, action] = useFormState(updateServiceAction, null);
  const id = `svc-${service.id}`;
  return (
    <form action={action} className="svc-form">
      <input type="hidden" name="id" value={service.id} />
      <div className="name">
        <strong>{service.name}</strong>
        <small>CDT {service.code}</small>
        {state?.error && <span className="error" role="alert" style={{ fontSize: '.85rem' }}>{state.error}</span>}
        {state?.ok && <span role="status" style={{ fontSize: '.85rem', color: 'var(--ok)', fontWeight: 700 }}>{state.ok}</span>}
      </div>
      <label htmlFor={`${id}-price`}>Price (USD)<input id={`${id}-price`} name="price" type="number" min="0" step="1" defaultValue={service.price} /></label>
      <label htmlFor={`${id}-dur`}>Minutes<input id={`${id}-dur`} name="duration" type="number" min="15" max="240" step="15" defaultValue={service.duration} /></label>
      <label className="check" htmlFor={`${id}-on`} style={{ color: 'var(--ink)', fontSize: '.95rem' }}>
        <input id={`${id}-on`} name="active" type="checkbox" defaultChecked={service.active} /> Bookable
      </label>
      <Save />
    </form>
  );
}
