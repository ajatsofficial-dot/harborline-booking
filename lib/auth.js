import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'hb_session';
const SESSION_HOURS = 8;
const enc = new TextEncoder();

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set to at least 32 characters in production.');
  }
  return 'dev-only-secret-change-me-dev-only-secret';
}

const b64url = (bytes) =>
  Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmac(data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data))));
}

async function sha256(s) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Constant-time password check against ADMIN_PASSWORD. */
export async function passwordMatches(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return equalBytes(await sha256(String(input)), await sha256(expected));
}

export async function createSessionToken() {
  const body = b64url(enc.encode(JSON.stringify({ role: 'admin', exp: Date.now() + SESSION_HOURS * 3600e3 })));
  return `${body}.${await hmac(body)}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes('.')) return false;
  const [body, sig] = token.split('.');
  if (!equalBytes(enc.encode(sig), enc.encode(await hmac(body)))) return false;
  try {
    const data = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return data.role === 'admin' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdmin() {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_HOURS * 3600,
};
