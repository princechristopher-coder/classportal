import { z } from 'zod';

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.')
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.')
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  });

export const courseSchema = z.object({
  title: z.string().trim().min(3),
  slug: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers and hyphens.'),
  description: z.string().trim().min(10),
  thumbnail: z.string().optional().nullable(),
  price: z.number().min(0),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  published: z.boolean().optional()
});

export const lessonSchema = z.object({
  title: z.string().trim().min(2),
  videoUrl: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(0).default(0),
  isFree: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  quizUrl: z.string().trim().optional().nullable(),
  order: z.number().int().min(0).default(0),
  courseId: z.string().min(1)
});

export const progressUpdateSchema = z.object({
  currentTime: z.number().min(0),
  watchedPercent: z.number().min(0).max(100)
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  avatar: z.string().optional().nullable()
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
  });
