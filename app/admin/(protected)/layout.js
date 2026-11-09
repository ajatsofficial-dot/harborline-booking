import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { LogoMark } from '../../components';
import { logoutAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Front desk', robots: { index: false } };

export default async function AdminLayout({ children }) {
  if (!(await isAdmin())) redirect('/admin/login');
  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="wrap">
          <Link href="/admin" className="logo"><LogoMark />Front desk</Link>
          <nav className="admin-nav" aria-label="Admin">
            <Link href="/admin">Schedule</Link>
            <Link href="/admin/services">Services</Link>
            <a href="/api/admin/export">Export CSV</a>
            <Link href="/" target="_blank">View site</Link>
            <form action={logoutAction}><button type="submit">Sign out</button></form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
