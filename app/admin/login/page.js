import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff sign in', robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin');
  const demo = process.env.DEMO_MODE === 'true';
  return (
    <main className="login">
      <div>
        <span className="eyebrow">Harborline · Staff</span>
        <h1 style={{ fontSize: '2rem', marginTop: 6 }}>Front desk sign in</h1>
      </div>
      <LoginForm />
      {demo && (
        <p className="notice">Demo password: <span className="mono">{process.env.ADMIN_PASSWORD}</span></p>
      )}
    </main>
  );
}
