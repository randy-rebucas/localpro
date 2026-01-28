import { z } from 'zod';

// MPIN must be 4-6 digits
export const mpinSchema = z.string().regex(/^\d{4,6}$/);

export type MPIN = z.infer<typeof mpinSchema>;
