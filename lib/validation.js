import { z } from 'zod';
import { DATE_RE } from './time.js';

const digits = (s) => s.replace(/\D/g, '');

export const bookingSchema = z.object({
  serviceId: z.coerce.number().int().positive({ message: 'Choose a service.' }),
  date: z.string().regex(DATE_RE, { message: 'Choose a date.' }),
  start: z.coerce.number().int().min(0).max(24 * 60, { message: 'Choose a time.' }),
  name: z.string().trim().min(2, { message: 'Enter your full name.' }).max(80),
  phone: z.string().trim().refine((v) => digits(v).length >= 10 && digits(v).length <= 15, {
    message: 'Enter a mobile number with at least 10 digits.',
  }),
  email: z.union([z.literal(''), z.string().trim().email({ message: 'Enter a valid email or leave it blank.' })]).optional(),
  notes: z.string().trim().max(500, { message: 'Keep notes under 500 characters.' }).optional(),
  newPatient: z.boolean(),
});

export const serviceUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  price: z.coerce.number().min(0).max(10000),
  duration: z.coerce.number().int().min(15).max(240).refine((v) => v % 15 === 0, {
    message: 'Duration must be a multiple of 15 minutes.',
  }),
  active: z.boolean(),
});
