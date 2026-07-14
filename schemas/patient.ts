import { z } from 'zod';

export const patientSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Please enter a valid date' })
    .refine((val) => new Date(val) <= new Date(), { message: 'Date of birth cannot be in the future' })
    .refine((val) => new Date().getFullYear() - new Date(val).getFullYear() <= 130, {
      message: 'Please enter a valid date of birth',
    }),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^\+?[0-9\s\-().]{7,20}$/,
      'Enter a valid phone number (7–20 digits, optional +, spaces, dashes)',
    ),
});

export type PatientSchemaValues = z.infer<typeof patientSchema>;
