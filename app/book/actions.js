'use server';

import { redirect } from 'next/navigation';
import { bookingSchema } from '@/lib/validation';
import { createBooking } from '@/lib/data';

export async function createBookingAction(_prev, formData) {
  // Honeypot: real people never see or fill this field.
  if (formData.get('company')) return { error: 'Your request could not be sent. Please call us instead.' };

  const parsed = bookingSchema.safeParse({
    serviceId: formData.get('serviceId'),
    date: formData.get('date'),
    start: formData.get('start'),
    name: formData.get('name') ?? '',
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    notes: formData.get('notes') ?? '',
    newPatient: formData.get('newPatient') === 'on',
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: String(issue.path[0] ?? '') };
  }

  const result = await createBooking(parsed.data);
  if (result.error) return { error: result.error, field: 'start', refresh: Date.now() };

  redirect(`/book/done/${result.ref}`);
}
