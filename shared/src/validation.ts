import { z } from 'zod';

/**
 * Schema for the unauthenticated `/api/calculate` preview endpoint.
 * Validates category, subcategory, and numeric value.
 */
export const calculationRequestSchema = z.object({
  category: z.enum(['energy', 'transport', 'food', 'waste'], {
    errorMap: () => ({ message: 'Category must be one of: energy, transport, food, waste' }),
  }),
  subCategory: z.string().trim().min(1, 'Subcategory is required'),
  value: z.number().nonnegative('Value must be a non-negative number'),
});

/**
 * Schema for creating a new footprint log entry via `POST /api/footprint`.
 * Validates date format, category, value, unit, subcategory, and optional notes.
 */
export const footprintEntrySchema = z.object({
  entryDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.enum(['energy', 'transport', 'food', 'waste'], {
    errorMap: () => ({ message: 'Category must be one of: energy, transport, food, waste' }),
  }),
  inputValue: z.number().positive('Input value must be greater than zero'),
  inputUnit: z.string().trim().min(1, 'Unit of measurement is required'),
  subCategory: z.string().trim().min(1, 'Subcategory type is required'),
  notes: z.string().trim().max(200, 'Notes cannot exceed 200 characters').optional(),
});

/**
 * Schema for purchasing carbon offsets via `POST /api/offsets/purchase`.
 * Validates project ID and offset amount.
 */
export const offsetPurchaseSchema = z.object({
  projectId: z.string().trim().min(1, 'Project ID is required'),
  offsetAmountCo2eKg: z.number().positive('Offset carbon amount must be a positive number'),
});

/**
 * Schema for updating user profile fields via `PATCH /api/user/profile`.
 * Both fields are optional and nullable.
 */
export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name cannot be empty').max(50, 'Display name must be 50 characters or fewer').nullable().optional(),
  avatarUrl: z.string().trim().url('Avatar URL must be a valid URL').nullable().optional(),
});

/**
 * Schema for creating or updating a monthly carbon reduction goal via `POST /api/user/goals`.
 * Validates category, target value, and month format.
 */
export const userGoalSchema = z.object({
  category: z.string().trim().min(1, 'Category is required'),
  targetValue: z.number().positive('Goal target value must be a positive number'),
  targetMonth: z.string().trim().regex(/^\d{4}-\d{2}$/, 'Target month must be in YYYY-MM format'),
});
