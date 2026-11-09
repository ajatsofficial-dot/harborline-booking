import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="login" style={{ textAlign: 'left' }}>
      <span className="eyebrow">404</span>
      <h1 style={{ fontSize: '2rem' }}>We couldn't find that page.</h1>
      <p className="muted">If you followed a booking link, check the reference or call the clinic.</p>
      <Link className="btn btn-primary" href="/">Go to the home page</Link>
    </main>
  );
}
