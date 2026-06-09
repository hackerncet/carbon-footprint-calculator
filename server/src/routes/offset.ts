import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { offsetPurchaseSchema, SIMULATED_PROJECTS } from '@carbon/shared';
import { db } from '../config/db.js';
import { users, offsetPurchases } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { awardBadge } from '../utils/gamification.js';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

const router = Router();

// Require authentication for all offset routes
router.use(requireAuth);

/**
 * GET /api/offsets
 * Returns the authenticated user's offset purchase history,
 * ordered by most recent first.
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const purchases = await db.query.offsetPurchases.findMany({
      where: eq(offsetPurchases.userId, userId),
      orderBy: [desc(offsetPurchases.purchasedAt)],
    });

    res.json(purchases);
  } catch (error: unknown) {
    logger.error('Error fetching offset purchases', { error });
    res.status(500).json({ error: 'Failed to fetch offset history' });
  }
});

/**
 * POST /api/offsets/purchase
 * Purchases a simulated carbon offset using ZeroGrid Points.
 * Validates sufficient points balance, deducts cost within a transaction,
 * and awards the Carbon Offset Champion badge on first purchase.
 */
router.post('/purchase', async (req, res) => {
  try {
    const userId = req.user!.uid;

    const validationResult = offsetPurchaseSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors[0].message });
    }

    const { projectId, offsetAmountCo2eKg } = validationResult.data;

    // Find the project configuration
    const project = SIMULATED_PROJECTS.find(p => p.id === projectId);
    if (!project) {
      return res.status(400).json({ error: 'Invalid simulated project ID' });
    }

    // Calculate required points cost
    const requiredPoints = Math.round(offsetAmountCo2eKg * project.factor);

    const purchaseId = crypto.randomUUID();

    // Perform purchase: update points and write purchase record atomically
    db.transaction((tx) => {
      const userTx = tx.select().from(users).where(eq(users.id, userId)).get();

      if (!userTx) {
        throw new Error('User profile not found');
      }

      if (userTx.points < requiredPoints) {
        throw new Error(`Insufficient Eco-Points. Required: ${requiredPoints}, Available: ${userTx.points}`);
      }

      tx.update(users)
        .set({ points: sql`${users.points} - ${requiredPoints}` })
        .where(eq(users.id, userId))
        .run();

      tx.insert(offsetPurchases).values({
        id: purchaseId,
        userId,
        projectId,
        offsetAmountCo2eKg,
        costSimulatedCurrency: requiredPoints,
      }).run();
    });

    // Proactively award the Carbon Offset Champion badge
    const badgeAwarded = await awardBadge(userId, 'carbon_offset_champion');

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    res.status(201).json({
      message: `Successfully offset ${offsetAmountCo2eKg} kg of CO2e!`,
      purchase: {
        id: purchaseId,
        projectId,
        offsetAmountCo2eKg,
        costSimulatedCurrency: requiredPoints,
        purchasedAt: Math.floor(Date.now() / 1000),
      },
      user: updatedUser,
      badgeAwarded,
    });

  } catch (error: unknown) {
    const message = (error && typeof error === 'object' && 'message' in error)
      ? String((error as any).message)
      : String(error);

    if (message.includes('Insufficient Eco-Points')) {
      return res.status(400).json({ error: message });
    }
    if (message.includes('User profile not found')) {
      return res.status(404).json({ error: message });
    }
    logger.error('Error purchasing offsets', { error });
    res.status(500).json({ error: 'Failed to process offset purchase' });
  }
});

export default router;
