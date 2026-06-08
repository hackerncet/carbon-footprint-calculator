import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Firebase UID
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
  points: integer('points').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  lastActiveDate: text('last_active_date'), // YYYY-MM-DD
});

export const footprintEntries = sqliteTable('footprint_entries', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entryDate: text('entry_date').notNull(), // YYYY-MM-DD
  category: text('category').notNull(), // 'energy', 'transport', 'food', 'waste'
  inputValue: real('input_value').notNull(),
  inputUnit: text('input_unit').notNull(),
  carbonCo2eKg: real('carbon_co2e_kg').notNull(),
  metadata: text('metadata').notNull(), // JSON string for details
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  userIdIdx: index('footprint_user_id_idx').on(table.userId),
  entryDateIdx: index('footprint_entry_date_idx').on(table.entryDate),
  userEntryDateIdx: index('footprint_user_entry_date_idx').on(table.userId, table.entryDate),
}));

export const userChallenges = sqliteTable('user_challenges', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: text('challenge_id').notNull(), // e.g., 'meatless_week'
  status: text('status').notNull().default('active'), // 'active', 'completed', 'failed'
  progress: real('progress').notNull().default(0.0),
  startedAt: integer('started_at').notNull().default(sql`(strftime('%s', 'now'))`),
  completedAt: integer('completed_at'), // timestamp
}, (table) => ({
  userIdIdx: index('challenges_user_id_idx').on(table.userId),
  userChallengeStatusIdx: index('challenges_user_status_idx').on(table.userId, table.status),
}));

export const userAchievements = sqliteTable('user_achievements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: text('badge_id').notNull(), // 'first_calculation', etc.
  awardedAt: integer('awarded_at').notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  userIdIdx: index('achievements_user_id_idx').on(table.userId),
}));

export const offsetPurchases = sqliteTable('offset_purchases', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull(),
  offsetAmountCo2eKg: real('offset_amount_co2e_kg').notNull(),
  costSimulatedCurrency: real('cost_simulated_currency').notNull(),
  purchasedAt: integer('purchased_at').notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  userIdIdx: index('offsets_user_id_idx').on(table.userId),
  userPurchasedAtIdx: index('offsets_user_purchased_idx').on(table.userId, table.purchasedAt),
}));

export const userGoals = sqliteTable('user_goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'energy', 'transport', 'food', 'waste', 'total'
  targetValue: real('target_value').notNull(), // target in kg CO2e
  targetMonth: text('target_month').notNull(), // YYYY-MM
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  userIdIdx: index('goals_user_id_idx').on(table.userId),
  userTargetMonthIdx: index('goals_user_target_month_idx').on(table.userId, table.targetMonth),
}));

export type DBUser = typeof users.$inferSelect;
export type DBFootprintEntry = typeof footprintEntries.$inferSelect;
export type DBUserChallenge = typeof userChallenges.$inferSelect;
export type DBUserAchievement = typeof userAchievements.$inferSelect;
export type DBOffsetPurchase = typeof offsetPurchases.$inferSelect;
export type DBUserGoal = typeof userGoals.$inferSelect;
