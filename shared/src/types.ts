/**
 * Represents a registered user in the ZeroGrid platform.
 * Corresponds to the `users` table in the SQLite database.
 */
export interface User {
  /** Firebase UID, serves as the primary key. */
  id: string;
  /** User's email address (unique). */
  email: string;
  /** User-chosen display name or auto-derived from email prefix. */
  displayName: string | null;
  /** URL to the user's avatar image (e.g., Google profile picture). */
  avatarUrl: string | null;
  /** Unix timestamp (seconds) when the user was first created. */
  createdAt: number;
  /** Cumulative ZeroGrid gamification points. */
  points: number;
  /** Number of consecutive days the user has logged footprint data. */
  currentStreak: number;
  /** ISO date string (YYYY-MM-DD) of the user's last footprint log. */
  lastActiveDate: string | null;
}

/**
 * A single carbon footprint log entry submitted by a user.
 * Corresponds to the `footprint_entries` table.
 */
export interface FootprintEntry {
  /** UUID primary key. */
  id: string;
  /** Firebase UID of the owning user. */
  userId: string;
  /** ISO date string (YYYY-MM-DD) for the activity date. */
  entryDate: string;
  /** Top-level emission category. */
  category: 'energy' | 'transport' | 'food' | 'waste';
  /** Raw numeric value entered by the user (e.g., kWh, km, kg). */
  inputValue: number;
  /** Unit of measurement for `inputValue` (e.g., 'kWh', 'km', 'kg'). */
  inputUnit: string;
  /** Calculated carbon dioxide equivalent in kilograms. */
  carbonCo2eKg: number;
  /** JSON-stringified metadata (subCategory, notes, calculatedUnit). */
  metadata: string;
  /** Unix timestamp (seconds) when the entry was created. */
  createdAt: number;
}

/**
 * Tracks a user's progress toward an eco-challenge.
 * Corresponds to the `user_challenges` table.
 */
export interface UserChallenge {
  /** Composite primary key (`{userId}_{challengeId}`). */
  id: string;
  /** Firebase UID of the owning user. */
  userId: string;
  /** Reference to the challenge definition ID (e.g., 'meatless_week'). */
  challengeId: string;
  /** Current lifecycle status of the challenge. */
  status: 'active' | 'completed' | 'failed';
  /** Numeric progress toward the challenge target. */
  progress: number;
  /** Unix timestamp (seconds) when the challenge was started. */
  startedAt: number;
  /** Unix timestamp (seconds) when the challenge was completed, or null. */
  completedAt: number | null;
}

/**
 * Represents a badge/achievement awarded to a user.
 * Corresponds to the `user_achievements` table.
 */
export interface UserAchievement {
  /** Composite primary key (`{userId}_{badgeId}`). */
  id: string;
  /** Firebase UID of the owning user. */
  userId: string;
  /** Identifier of the badge (e.g., 'first_calculation', 'streak_7'). */
  badgeId: string;
  /** Unix timestamp (seconds) when the badge was awarded. */
  awardedAt: number;
}

/**
 * Represents a simulated carbon offset purchase.
 * Corresponds to the `offset_purchases` table.
 */
export interface OffsetPurchase {
  /** UUID primary key. */
  id: string;
  /** Firebase UID of the purchasing user. */
  userId: string;
  /** Reference to the simulated project ID. */
  projectId: string;
  /** Amount of CO₂e offset in kilograms. */
  offsetAmountCo2eKg: number;
  /** Points spent (simulated currency). */
  costSimulatedCurrency: number;
  /** Unix timestamp (seconds) of the purchase. */
  purchasedAt: number;
}

/**
 * Payload for the `/api/calculate` preview endpoint.
 * No authentication required.
 */
export interface CarbonCalculationRequest {
  /** Top-level emission category. */
  category: 'energy' | 'transport' | 'food' | 'waste';
  /** Specific activity subcategory (e.g., 'electricity', 'petrol_car', 'beef'). */
  subCategory: string;
  /** Raw numeric value for the activity. */
  value: number;
}

/**
 * Response from the carbon calculation engine.
 */
export interface CarbonCalculationResponse {
  /** Calculated CO₂e in kilograms. */
  carbonCo2eKg: number;
  /** Unit of measurement for the input value. */
  unit: string;
}

/**
 * Aggregated dashboard response containing KPIs, breakdowns, and trends.
 */
export interface DashboardSummaryResponse {
  /** Full user profile data. */
  user: User;
  /** Key performance indicators for the current month. */
  kpis: {
    /** Total carbon emissions this month in kg CO₂e. */
    totalCarbonThisMonthKg: number;
    /** Total gamification points earned. */
    pointsEarned: number;
    /** Current consecutive-day login streak. */
    activeStreak: number;
    /** Number of completed eco-challenges. */
    challengesCompleted: number;
  };
  /** All-time category breakdown with percentages. */
  breakdown: {
    /** Emission category name. */
    category: string;
    /** Total CO₂e in kg for this category. */
    value: number;
    /** Percentage of total emissions. */
    percentage: number;
  }[];
  /** Monthly historical trend data for the last 6 months. */
  monthlyHistory: {
    /** Month label (e.g., 'Jun 26'). */
    month: string;
    /** Total carbon emissions in kg for the month. */
    carbonKg: number;
    /** Total offsets purchased in kg for the month. */
    offsetKg: number;
    /** Paris Agreement target in kg (≈400 kg/month). */
    targetKg: number;
  }[];
  /** Carbon reduction goals for the current month. */
  goals?: UserGoal[];
}

/**
 * A monthly carbon reduction goal set by the user.
 * Corresponds to the `user_goals` table.
 */
export interface UserGoal {
  /** UUID primary key. */
  id: string;
  /** Firebase UID of the owning user. */
  userId: string;
  /** Goal category ('energy', 'transport', 'food', 'waste', or 'total'). */
  category: string;
  /** Target maximum emissions in kg CO₂e. */
  targetValue: number;
  /** Target month in YYYY-MM format. */
  targetMonth: string;
  /** Unix timestamp (seconds) when the goal was created. */
  createdAt: number;
}

/**
 * Standard API error response shape.
 */
export interface ApiErrorResponse {
  /** Human-readable error message. */
  error: string;
  /** Optional flag indicating email verification status. */
  emailVerified?: boolean;
}
