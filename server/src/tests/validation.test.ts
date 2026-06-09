import { describe, it, expect } from 'vitest';
import {
  calculationRequestSchema,
  footprintEntrySchema,
  offsetPurchaseSchema,
  profileUpdateSchema,
  userGoalSchema,
} from '@carbon/shared';

describe('Zod Validation Schemas', () => {
  describe('calculationRequestSchema', () => {
    it('accepts valid calculation request', () => {
      const result = calculationRequestSchema.safeParse({
        category: 'energy',
        subCategory: 'electricity',
        value: 100,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid category', () => {
      const result = calculationRequestSchema.safeParse({
        category: 'nuclear',
        subCategory: 'electricity',
        value: 100,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative value', () => {
      const result = calculationRequestSchema.safeParse({
        category: 'energy',
        subCategory: 'electricity',
        value: -5,
      });
      expect(result.success).toBe(false);
    });

    it('accepts zero value', () => {
      const result = calculationRequestSchema.safeParse({
        category: 'energy',
        subCategory: 'electricity',
        value: 0,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty subcategory', () => {
      const result = calculationRequestSchema.safeParse({
        category: 'energy',
        subCategory: '',
        value: 100,
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from subCategory', () => {
      const result = calculationRequestSchema.safeParse({
        category: 'energy',
        subCategory: '  electricity  ',
        value: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subCategory).toBe('electricity');
      }
    });
  });

  describe('footprintEntrySchema', () => {
    const validEntry = {
      entryDate: '2026-01-15',
      category: 'transport',
      inputValue: 50,
      inputUnit: 'km',
      subCategory: 'petrol_car',
    };

    it('accepts valid footprint entry', () => {
      expect(footprintEntrySchema.safeParse(validEntry).success).toBe(true);
    });

    it('accepts entry with optional notes', () => {
      const result = footprintEntrySchema.safeParse({ ...validEntry, notes: 'Daily commute' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      expect(footprintEntrySchema.safeParse({ ...validEntry, entryDate: '15-01-2026' }).success).toBe(false);
    });

    it('rejects zero input value', () => {
      expect(footprintEntrySchema.safeParse({ ...validEntry, inputValue: 0 }).success).toBe(false);
    });

    it('rejects negative input value', () => {
      expect(footprintEntrySchema.safeParse({ ...validEntry, inputValue: -10 }).success).toBe(false);
    });

    it('rejects notes exceeding 200 chars', () => {
      expect(footprintEntrySchema.safeParse({ ...validEntry, notes: 'x'.repeat(201) }).success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(footprintEntrySchema.safeParse({ entryDate: '2026-01-15' }).success).toBe(false);
    });
  });

  describe('offsetPurchaseSchema', () => {
    it('accepts valid offset purchase', () => {
      const result = offsetPurchaseSchema.safeParse({
        projectId: 'amazon_reforestation',
        offsetAmountCo2eKg: 100,
      });
      expect(result.success).toBe(true);
    });

    it('rejects zero offset amount', () => {
      const result = offsetPurchaseSchema.safeParse({
        projectId: 'amazon_reforestation',
        offsetAmountCo2eKg: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty project ID', () => {
      const result = offsetPurchaseSchema.safeParse({
        projectId: '',
        offsetAmountCo2eKg: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('profileUpdateSchema', () => {
    it('accepts valid profile update', () => {
      const result = profileUpdateSchema.safeParse({
        displayName: 'EcoUser',
        avatarUrl: 'https://example.com/avatar.png',
      });
      expect(result.success).toBe(true);
    });

    it('accepts null displayName', () => {
      const result = profileUpdateSchema.safeParse({ displayName: null });
      expect(result.success).toBe(true);
    });

    it('accepts empty object (all optional)', () => {
      const result = profileUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const result = profileUpdateSchema.safeParse({ avatarUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects displayName over 50 chars', () => {
      const result = profileUpdateSchema.safeParse({ displayName: 'x'.repeat(51) });
      expect(result.success).toBe(false);
    });
  });

  describe('userGoalSchema', () => {
    it('accepts valid goal', () => {
      const result = userGoalSchema.safeParse({
        category: 'energy',
        targetValue: 300,
        targetMonth: '2026-06',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid month format', () => {
      const result = userGoalSchema.safeParse({
        category: 'energy',
        targetValue: 300,
        targetMonth: '06-2026',
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero target value', () => {
      const result = userGoalSchema.safeParse({
        category: 'energy',
        targetValue: 0,
        targetMonth: '2026-06',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty category', () => {
      const result = userGoalSchema.safeParse({
        category: '',
        targetValue: 300,
        targetMonth: '2026-06',
      });
      expect(result.success).toBe(false);
    });
  });
});
