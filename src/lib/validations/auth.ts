import { z } from 'zod';

export const userRoleEnum = ['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP'] as const;

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(2, 'First name must be at least 2 characters.'),
    lastName: z.string().trim().min(2, 'Last name must be at least 2 characters.'),
    email: z.string().trim().email('Please enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    role: z.enum(userRoleEnum),
    universityId: z.string().trim().optional().nullable(),
    city: z.string().trim().min(1, 'City is required.'),
    state: z.string().trim().min(1, 'State is required.'),
    formattedAddress: z.string().trim().optional(),
    country: z.string().trim().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.role === 'STUDENT' || data.role === 'FACULTY') && !data.universityId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['universityId'],
        message: 'Please select your university.',
      });
    }
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
