import { z } from 'zod';

export const symptomsSchema = z.object({
  chiefComplaint: z
    .string()
    .min(3, 'Chief complaint must be at least 3 characters')
    .max(300, 'Chief complaint must be less than 300 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type SymptomsSchemaValues = z.infer<typeof symptomsSchema>;
