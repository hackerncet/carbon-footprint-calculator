import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { profileUpdateSchema } from '@carbon/shared';
import { db } from '../config/db.js';
import { users, footprintEntries, userChallenges, userAchievements, offsetPurchases, userGoals } from '../db/schema.js';
import { getOrCreateUser } from '../utils/userService.js';
import { logger } from '../config/logger.js';
import { eq, and, desc, sql, gte } from 'drizzle-orm';

const router = Router();

// Require authentication for all user/dashboard endpoints
router.use(requireAuth);

/**
 * GET /api/user/profile
 * Returns the authenticated user's profile, creating it if necessary.
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const email = req.user!.email;
    const user = await getOrCreateUser(userId, email);
    res.json(user);
  } catch (error: unknown) {
    logger.error('Error fetching user profile', { error });
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * PATCH /api/user/profile
 * Updates the user's displayName and/or avatarUrl.
 */
router.patch('/profile', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const email = req.user!.email;
    const user = await getOrCreateUser(userId, email);

    const validationResult = profileUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors[0].message });
    }

    const { displayName, avatarUrl } = validationResult.data;

    await db.update(users)
      .set({
        displayName: displayName !== undefined ? displayName : user.displayName,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
      })
      .where(eq(users.id, userId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    res.json(updatedUser);
  } catch (error: unknown) {
    logger.error('Error updating user profile', { error });
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

/**
 * GET /api/user/challenges
 * Returns all eco-challenge records for the authenticated user.
 */
router.get('/challenges', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const email = req.user!.email;
    await getOrCreateUser(userId, email);

    const challenges = await db.query.userChallenges.findMany({
      where: eq(userChallenges.userId, userId),
    });

    res.json(challenges);
  } catch (error: unknown) {
    logger.error('Error fetching user challenges', { error });
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

/**
 * GET /api/user/achievements
 * Returns all awarded badges for the authenticated user.
 */
router.get('/achievements', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const email = req.user!.email;
    await getOrCreateUser(userId, email);

    const achievements = await db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, userId),
    });

    res.json(achievements);
  } catch (error: unknown) {
    logger.error('Error fetching user achievements', { error });
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * GET /api/user/dashboard
 * Returns the aggregated dashboard including KPIs, category breakdown,
 * monthly historical trends, and goals.
 *
 * Performance: Uses bulk queries instead of per-month iteration (N+1 fix).
 * Previous implementation made 12 separate DB queries for 6 months of data;
 * this version uses 2 bulk queries + in-memory aggregation via Maps.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const email = req.user!.email;
    const user = await getOrCreateUser(userId, email);

    // 1. Get current month YYYY-MM
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}`;

    // 2. Calculate the earliest month key for the 6-month window
    const earliestMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const earliestMonthKey = `${earliestMonth.getFullYear()}-${(earliestMonth.getMonth() + 1).toString().padStart(2, '0')}`;

    // 3. Fetch ALL footprint entries for the last 6 months in a SINGLE query (N+1 fix)
    const allRecentEntries = await db.query.footprintEntries.findMany({
      where: and(
        eq(footprintEntries.userId, userId),
        gte(footprintEntries.entryDate, earliestMonthKey + '-01')
      ),
    });

    // 4. Fetch ALL offset purchases for the last 6 months in a SINGLE query (N+1 fix)
    const earliestTimestamp = Math.floor(earliestMonth.getTime() / 1000);
    const allRecentOffsets = await db.query.offsetPurchases.findMany({
      where: and(
        eq(offsetPurchases.userId, userId),
        gte(offsetPurchases.purchasedAt, earliestTimestamp)
      ),
    });

    // 5. Aggregate current month carbon
    const totalCarbonThisMonthKg = allRecentEntries
      .filter(e => e.entryDate.startsWith(currentMonthStr))
      .reduce((acc, entry) => acc + entry.carbonCo2eKg, 0);

    // 6. Count completed challenges
    const completedChallengesList = await db.query.userChallenges.findMany({
      where: and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.status, 'completed')
      ),
    });

    // 7. Calculate all-time category breakdown
    const allEntries = await db.query.footprintEntries.findMany({
      where: eq(footprintEntries.userId, userId),
    });

    const categorySums: Record<string, number> = { energy: 0, transport: 0, food: 0, waste: 0 };
    let allTimeTotal = 0;
    for (const entry of allEntries) {
      if (entry.category in categorySums) {
        categorySums[entry.category] += entry.carbonCo2eKg;
        allTimeTotal += entry.carbonCo2eKg;
      }
    }

    const breakdown = Object.entries(categorySums).map(([category, value]) => ({
      category,
      value: parseFloat(value.toFixed(2)),
      percentage: allTimeTotal > 0 ? parseFloat(((value / allTimeTotal) * 100).toFixed(1)) : 0,
    }));

    // 8. Build monthly history using in-memory Maps (replaces 12 separate queries)
    const carbonByMonth = new Map<string, number>();
    const offsetByMonth = new Map<string, number>();

    for (const entry of allRecentEntries) {
      const monthKey = entry.entryDate.substring(0, 7); // 'YYYY-MM'
      carbonByMonth.set(monthKey, (carbonByMonth.get(monthKey) || 0) + entry.carbonCo2eKg);
    }

    for (const offset of allRecentOffsets) {
      const offsetDate = new Date(offset.purchasedAt * 1000);
      const monthKey = `${offsetDate.getFullYear()}-${(offsetDate.getMonth() + 1).toString().padStart(2, '0')}`;
      offsetByMonth.set(monthKey, (offsetByMonth.get(monthKey) || 0) + offset.offsetAmountCo2eKg);
    }

    const monthlyHistory = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetMonth.getFullYear();
      const monthNum = targetMonth.getMonth() + 1;
      const monthKey = `${year}-${monthNum.toString().padStart(2, '0')}`;
      const monthLabel = targetMonth.toLocaleString('default', { month: 'short', year: '2-digit' });

      monthlyHistory.push({
        month: monthLabel,
        carbonKg: parseFloat((carbonByMonth.get(monthKey) || 0).toFixed(2)),
        offsetKg: parseFloat((offsetByMonth.get(monthKey) || 0).toFixed(2)),
        targetKg: 400.0, // Paris Target (approx 4.8 tons per year per person)
      });
    }

    // 9. Fetch monthly goals for the current month
    const goalsList = await db.query.userGoals.findMany({
      where: and(
        eq(userGoals.userId, userId),
        eq(userGoals.targetMonth, currentMonthStr)
      ),
    });

    res.json({
      user,
      kpis: {
        totalCarbonThisMonthKg: parseFloat(totalCarbonThisMonthKg.toFixed(2)),
        pointsEarned: user.points,
        activeStreak: user.currentStreak,
        challengesCompleted: completedChallengesList.length,
      },
      breakdown,
      monthlyHistory,
      goals: goalsList,
    });

  } catch (error: unknown) {
    logger.error('Error fetching dashboard summary', { error });
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
