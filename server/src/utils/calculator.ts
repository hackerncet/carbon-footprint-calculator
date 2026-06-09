import { EMISSION_FACTORS, UNITS_MAP, Category } from '@carbon/shared';

/**
 * Calculates the carbon dioxide equivalent (CO₂e) emissions for a given activity.
 *
 * Uses a Map-based lookup against the shared `EMISSION_FACTORS` and `UNITS_MAP`
 * constants, reducing cyclomatic complexity from O(n) if-else chains to O(1) lookups.
 *
 * @param category - The top-level emission category ('energy', 'transport', 'food', 'waste').
 * @param subCategory - The specific activity type within the category (e.g., 'electricity', 'petrol_car').
 * @param value - The numeric input value (must be a non-negative finite number).
 * @returns An object containing the calculated CO₂e in kg and the input unit.
 * @throws {Error} If the category, subcategory, or value is invalid.
 *
 * @example
 * ```ts
 * calculateCarbon('energy', 'electricity', 100);
 * // => { carbonCo2eKg: 38, unit: 'kWh' }
 * ```
 */
export function calculateCarbon(
  category: Category,
  subCategory: string,
  value: number
): { carbonCo2eKg: number; unit: string } {
  // Validate input value
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid value: ${value}. Must be a non-negative finite number.`);
  }

  // Look up the category factors
  const categoryFactors = EMISSION_FACTORS[category];
  if (!categoryFactors) {
    throw new Error(`Invalid category: ${category}`);
  }

  // Look up the subcategory factor
  const factor = (categoryFactors as Record<string, number>)[subCategory];
  if (factor === undefined) {
    throw new Error(`Invalid subCategory "${subCategory}" for category "${category}"`);
  }

  // Look up the unit
  const unit = UNITS_MAP[subCategory];
  if (!unit) {
    throw new Error(`No unit mapping found for subCategory "${subCategory}"`);
  }

  return {
    carbonCo2eKg: parseFloat((value * factor).toFixed(2)),
    unit,
  };
}
