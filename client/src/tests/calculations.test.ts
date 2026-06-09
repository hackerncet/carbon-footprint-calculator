import { describe, it, expect } from 'vitest';
import { EMISSION_FACTORS, UNITS_MAP } from '@carbon/shared';

describe('Client Emission Factors Check', () => {
  it('resolves correct emission factors from the shared workspace', () => {
    expect(EMISSION_FACTORS.energy.electricity).toBe(0.38);
    expect(EMISSION_FACTORS.transport.petrol_car).toBe(0.17);
    expect(EMISSION_FACTORS.food.beef).toBe(27.0);
    expect(EMISSION_FACTORS.waste.landfill).toBe(0.45);
  });

  it('verifies all energy factors', () => {
    expect(EMISSION_FACTORS.energy.electricity).toBe(0.38);
    expect(EMISSION_FACTORS.energy.natural_gas).toBe(0.18);
  });

  it('verifies all transport factors', () => {
    expect(EMISSION_FACTORS.transport.petrol_car).toBe(0.17);
    expect(EMISSION_FACTORS.transport.diesel_car).toBe(0.16);
    expect(EMISSION_FACTORS.transport.electric_car).toBe(0.05);
    expect(EMISSION_FACTORS.transport.bus).toBe(0.09);
    expect(EMISSION_FACTORS.transport.train).toBe(0.04);
    expect(EMISSION_FACTORS.transport.flight_short).toBe(0.24);
    expect(EMISSION_FACTORS.transport.flight_long).toBe(0.15);
  });

  it('verifies all food factors', () => {
    expect(EMISSION_FACTORS.food.beef).toBe(27.0);
    expect(EMISSION_FACTORS.food.poultry).toBe(6.9);
    expect(EMISSION_FACTORS.food.vegetarian).toBe(2.0);
    expect(EMISSION_FACTORS.food.vegan).toBe(1.5);
  });

  it('verifies all waste factors', () => {
    expect(EMISSION_FACTORS.waste.landfill).toBe(0.45);
    expect(EMISSION_FACTORS.waste.recycled).toBe(0.02);
  });

  it('verifies UNITS_MAP covers all subcategories', () => {
    expect(UNITS_MAP['electricity']).toBe('kWh');
    expect(UNITS_MAP['natural_gas']).toBe('kWh');
    expect(UNITS_MAP['petrol_car']).toBe('km');
    expect(UNITS_MAP['beef']).toBe('kg');
    expect(UNITS_MAP['landfill']).toBe('kg');
  });

  it('confirms EMISSION_FACTORS is frozen', () => {
    expect(Object.isFrozen(EMISSION_FACTORS)).toBe(true);
    expect(Object.isFrozen(EMISSION_FACTORS.energy)).toBe(true);
    expect(Object.isFrozen(EMISSION_FACTORS.transport)).toBe(true);
    expect(Object.isFrozen(EMISSION_FACTORS.food)).toBe(true);
    expect(Object.isFrozen(EMISSION_FACTORS.waste)).toBe(true);
  });
});
