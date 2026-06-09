/**
 * CO₂e emission factors in kg CO₂e per unit of activity.
 *
 * Sources:
 * - Energy: UK DEFRA GHG Conversion Factors 2023 (grid average)
 * - Transport: EEA CO₂ Emission Performance Standards (EU average)
 * - Food: Poore & Nemecek (2018), Science 360(6392) — "Reducing food's environmental impacts"
 * - Waste: US EPA Waste Reduction Model (WARM) v15
 *
 * @remarks All objects are deeply frozen to prevent runtime mutation.
 */
export const EMISSION_FACTORS = Object.freeze({
  energy: Object.freeze({
    electricity: 0.38, // kg CO₂e per kWh
    natural_gas: 0.18, // kg CO₂e per kWh
  }),
  transport: Object.freeze({
    petrol_car: 0.17, // kg CO₂e per km
    diesel_car: 0.16, // kg CO₂e per km
    electric_car: 0.05, // kg CO₂e per km
    bus: 0.09, // kg CO₂e per km
    train: 0.04, // kg CO₂e per km
    flight_short: 0.24, // kg CO₂e per km (< 3 hours / approx 1500 km)
    flight_long: 0.15, // kg CO₂e per km
  }),
  food: Object.freeze({
    beef: 27.0, // kg CO₂e per kg
    poultry: 6.9, // kg CO₂e per kg
    vegetarian: 2.0, // kg CO₂e per kg
    vegan: 1.5, // kg CO₂e per kg
  }),
  waste: Object.freeze({
    landfill: 0.45, // kg CO₂e per kg of general waste
    recycled: 0.02, // kg CO₂e per kg of recycled waste
  }),
});

/** Top-level emission category type derived from EMISSION_FACTORS keys. */
export type Category = keyof typeof EMISSION_FACTORS;

/**
 * Maps each subcategory to its measurement unit.
 * Eliminates the need for per-subcategory unit lookup in calculator logic.
 *
 * @remarks Frozen to prevent runtime mutation.
 */
export const UNITS_MAP: Readonly<Record<string, string>> = Object.freeze({
  // Energy
  electricity: 'kWh',
  natural_gas: 'kWh',
  // Transport
  petrol_car: 'km',
  diesel_car: 'km',
  electric_car: 'km',
  bus: 'km',
  train: 'km',
  flight_short: 'km',
  flight_long: 'km',
  // Food
  beef: 'kg',
  poultry: 'kg',
  vegetarian: 'kg',
  vegan: 'kg',
  // Waste
  landfill: 'kg',
  recycled: 'kg',
});

/**
 * Simulated carbon offset projects available in the marketplace.
 * Users can invest ZeroGrid Points to "purchase" offsets from these projects.
 *
 * @remarks Frozen to prevent runtime mutation.
 */
export const SIMULATED_PROJECTS = Object.freeze([
  Object.freeze({
    id: 'amazon_reforestation',
    name: 'Amazon Rainforest Reforestation',
    description: 'Restore degraded land in the Amazon basin. Planting native trees captures carbon and restores biodiversity.',
    factor: 100, // points needed per kg of CO₂ offset
    costPerKg: 100,
    region: 'Brazil',
    type: 'Forestry',
  }),
  Object.freeze({
    id: 'wind_energy_texas',
    name: 'Texas Clean Wind Infrastructure',
    description: 'Replace fossil-fuel grid electricity by building utility-scale wind farms in west Texas.',
    factor: 80, // points needed per kg of CO₂ offset
    costPerKg: 80,
    region: 'United States',
    type: 'Renewables',
  }),
  Object.freeze({
    id: 'clean_water_uganda',
    name: 'Ugandan Clean Water Access',
    description: 'Providing clean borehole water to communities, eliminating the need to boil water using firewood.',
    factor: 120, // points needed per kg of CO₂ offset
    costPerKg: 120,
    region: 'Uganda',
    type: 'Community',
  }),
]);

/**
 * Predefined eco-challenges that users can complete to earn gamification points.
 * Challenge progress is tracked via the `user_challenges` table.
 *
 * @remarks Frozen to prevent runtime mutation.
 */
export const ECO_CHALLENGES = Object.freeze([
  Object.freeze({
    id: 'meatless_week',
    title: 'Meatless Week',
    description: 'Go vegetarian or vegan for a week (log vegetarian/vegan food logs only).',
    category: 'food',
    target: 7,
    pointsReward: 500,
  }),
  Object.freeze({
    id: 'car_free_commute',
    title: 'Car-Free Commute',
    description: 'Use public transit or electric cars for 3 travel logs instead of fossil fuel cars.',
    category: 'transport',
    target: 3,
    pointsReward: 350,
  }),
  Object.freeze({
    id: 'energy_saver',
    title: 'Vampire Draw Slayer',
    description: 'Log a home energy reading showing less than 100 kWh of total use.',
    category: 'energy',
    target: 100, // threshold
    pointsReward: 200,
  }),
  Object.freeze({
    id: 'waste_minimizer',
    title: 'Recycling Champion',
    description: 'Log recycled waste weight greater than general waste weight in a waste log.',
    category: 'waste',
    target: 1,
    pointsReward: 150,
  }),
]);
