import { describe, it, expect } from 'vitest';
import { calculateCarbon } from '../utils/calculator.js';
import { EMISSION_FACTORS, UNITS_MAP } from '@carbon/shared';

describe('Carbon Calculation Engine', () => {
  // Energy category
  describe('Energy calculations', () => {
    it('calculates electricity emissions correctly', () => {
      const result = calculateCarbon('energy', 'electricity', 100);
      expect(result.carbonCo2eKg).toBe(38);
      expect(result.unit).toBe('kWh');
    });

    it('calculates natural gas emissions correctly', () => {
      const result = calculateCarbon('energy', 'natural_gas', 50);
      expect(result.carbonCo2eKg).toBe(9);
      expect(result.unit).toBe('kWh');
    });
  });

  // Transport category
  describe('Transport calculations', () => {
    it('calculates petrol car emissions correctly', () => {
      const result = calculateCarbon('transport', 'petrol_car', 100);
      expect(result.carbonCo2eKg).toBe(17);
      expect(result.unit).toBe('km');
    });

    it('calculates diesel car emissions correctly', () => {
      const result = calculateCarbon('transport', 'diesel_car', 100);
      expect(result.carbonCo2eKg).toBe(16);
    });

    it('calculates electric car emissions correctly', () => {
      const result = calculateCarbon('transport', 'electric_car', 100);
      expect(result.carbonCo2eKg).toBe(5);
    });

    it('calculates bus emissions correctly', () => {
      const result = calculateCarbon('transport', 'bus', 100);
      expect(result.carbonCo2eKg).toBe(9);
    });

    it('calculates train emissions correctly', () => {
      const result = calculateCarbon('transport', 'train', 100);
      expect(result.carbonCo2eKg).toBe(4);
    });

    it('calculates short-haul flight emissions correctly', () => {
      const result = calculateCarbon('transport', 'flight_short', 1000);
      expect(result.carbonCo2eKg).toBe(240);
    });

    it('calculates long-haul flight emissions correctly', () => {
      const result = calculateCarbon('transport', 'flight_long', 1000);
      expect(result.carbonCo2eKg).toBe(150);
    });
  });

  // Food category
  describe('Food calculations', () => {
    it('calculates beef emissions correctly', () => {
      const result = calculateCarbon('food', 'beef', 2);
      expect(result.carbonCo2eKg).toBe(54);
      expect(result.unit).toBe('kg');
    });

    it('calculates poultry emissions correctly', () => {
      const result = calculateCarbon('food', 'poultry', 1);
      expect(result.carbonCo2eKg).toBe(6.9);
    });

    it('calculates vegetarian emissions correctly', () => {
      const result = calculateCarbon('food', 'vegetarian', 5);
      expect(result.carbonCo2eKg).toBe(10);
    });

    it('calculates vegan emissions correctly', () => {
      const result = calculateCarbon('food', 'vegan', 2);
      expect(result.carbonCo2eKg).toBe(3);
    });
  });

  // Waste category
  describe('Waste calculations', () => {
    it('calculates landfill emissions correctly', () => {
      const result = calculateCarbon('waste', 'landfill', 10);
      expect(result.carbonCo2eKg).toBe(4.5);
      expect(result.unit).toBe('kg');
    });

    it('calculates recycled waste emissions correctly', () => {
      const result = calculateCarbon('waste', 'recycled', 10);
      expect(result.carbonCo2eKg).toBe(0.2);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('returns 0 for zero input value', () => {
      const result = calculateCarbon('energy', 'electricity', 0);
      expect(result.carbonCo2eKg).toBe(0);
    });

    it('handles very small values correctly', () => {
      const result = calculateCarbon('energy', 'electricity', 0.01);
      expect(result.carbonCo2eKg).toBeCloseTo(0, 1);
    });

    it('handles very large values correctly', () => {
      const result = calculateCarbon('energy', 'electricity', 1_000_000);
      expect(result.carbonCo2eKg).toBe(380_000);
    });

    it('throws on negative input value', () => {
      expect(() => calculateCarbon('energy', 'electricity', -10)).toThrow('non-negative');
    });

    it('throws on NaN input value', () => {
      expect(() => calculateCarbon('energy', 'electricity', NaN)).toThrow('non-negative finite');
    });

    it('throws on Infinity input value', () => {
      expect(() => calculateCarbon('energy', 'electricity', Infinity)).toThrow('non-negative finite');
    });

    it('throws on invalid category', () => {
      expect(() => calculateCarbon('invalid' as 'energy', 'electricity', 100)).toThrow('Invalid category');
    });

    it('throws on invalid subcategory', () => {
      expect(() => calculateCarbon('energy', 'nuclear', 100)).toThrow('Invalid subCategory');
    });
  });

  // Cross-verify constants
  describe('UNITS_MAP consistency', () => {
    it('every emission factor subcategory has a corresponding unit', () => {
      for (const [, subCategories] of Object.entries(EMISSION_FACTORS)) {
        for (const subCat of Object.keys(subCategories)) {
          expect(UNITS_MAP[subCat]).toBeDefined();
        }
      }
    });
  });
});
