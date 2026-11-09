import './globals.css';

export const metadata = {
  title: { default: 'Harborline Family Dental · Book online', template: '%s · Harborline Family Dental' },
  description: 'Family dentist in North Tacoma. See real open times and book your visit online in under a minute.',
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#2440D8' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Martian+Mono:wght@400;500&family=Schibsted+Grotesk:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
