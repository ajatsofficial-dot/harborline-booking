'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSessionToken, isAdmin, passwordMatches, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { setBookingStatus, updateService, STATUSES } from '@/lib/data';
import { serviceUpdateSchema } from '@/lib/validation';

async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}

export async function loginAction(_prev, formData) {
  const ok = await passwordMatches(formData.get('password') ?? '');
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: 'That password is not right. Try again.' };
  }
  cookies().set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  redirect('/admin');
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect('/admin/login');
}

export async function updateStatusAction(formData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));
  if (!Number.isInteger(id) || !STATUSES.includes(status)) return;
  await setBookingStatus(id, status);
  revalidatePath('/admin');
}

export async function updateServiceAction(_prev, formData) {
  await requireAdmin();
  const parsed = serviceUpdateSchema.safeParse({
    id: formData.get('id'),
    price: formData.get('price'),
    duration: formData.get('duration'),
    active: formData.get('active') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, price, duration, active } = parsed.data;
  await updateService(id, { priceCents: Math.round(price * 100), durationMin: duration, active });
  revalidatePath('/admin/services');
  revalidatePath('/');
  return { ok: 'Saved.' };
}
