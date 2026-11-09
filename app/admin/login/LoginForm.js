'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '../actions';

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>;
}

export default function LoginForm() {
  const [state, action] = useFormState(loginAction, null);
  return (
    <form action={action}>
      <label className="field">Password<input name="password" type="password" autoComplete="current-password" required autoFocus /></label>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <Submit />
    </form>
  );
}
