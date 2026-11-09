// Optional: the app sets up its own tables on first request.
// Use these to prepare or reset a database by hand.
//   npm run db:setup   create tables, seed if empty
//   npm run db:reset   drop everything and start fresh
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@libsql/client';
import { setupDatabase } from '../lib/setup.js';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const client = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

const result = await setupDatabase(client, { reset: process.argv.includes('--reset') });
console.log(result.seeded
  ? `Seeded ${result.services} services, hours, settings and ${result.samples} sample bookings.`
  : 'Tables exist and already contain data. Nothing to seed.');
