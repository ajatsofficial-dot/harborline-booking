import Link from 'next/link';

export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          fill="var(--cobalt-ink)"
          d="M5 7.6C5 5.4 6.8 4.1 8.8 4.5c1.2.2 2 .7 3.2.7s2-.5 3.2-.7c2-.4 3.8.9 3.8 3.1 0 3-1 5.6-1.6 8.6-.4 2-1 4.3-2.3 4.3-1.5 0-1.5-4.1-3.1-4.1s-1.6 4.1-3.1 4.1c-1.3 0-1.9-2.3-2.3-4.3C6 13.2 5 10.6 5 7.6z"
        />
      </svg>
    </span>
  );
}

export function DemoBar() {
  if (process.env.DEMO_MODE !== 'true') return null;
  return (
    <div className="demo-bar">
      <div className="wrap">
        <span>Live demo of a fictional clinic. Bookings are saved to a demo database.</span>
        <Link href="/admin">Open the admin dashboard →</Link>
      </div>
    </div>
  );
}

export function SiteHeader({ clinicName = 'Harborline Family Dental', showNav = true }) {
  return (
    <>
      <DemoBar />
      <header className="site-head">
        <div className="wrap">
          <Link href="/" className="logo" aria-label={`${clinicName} home`}>
            <LogoMark />
            Harborline
          </Link>
          {showNav && (
            <nav className="site-nav" aria-label="Main">
              <Link href="/#services">Services</Link>
              <Link href="/#first-visit">First visit</Link>
              <Link href="/#hours">Hours</Link>
            </nav>
          )}
          <Link href="/book" className="btn btn-primary btn-sm">Book online</Link>
        </div>
      </header>
    </>
  );
}

export function SiteFooter({ settings }) {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <span>{settings.clinicName} · {settings.address}</span>
        <span className="mono">{settings.phone}</span>
      </div>
    </footer>
  );
}
