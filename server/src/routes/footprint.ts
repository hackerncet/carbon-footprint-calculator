import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { footprintEntrySchema } from '@carbon/shared';
import { db } from '../config/db.js';
import { footprintEntries } from '../db/schema.js';
import { calculateCarbon } from '../utils/calculator.js';
import { checkAndUpdateStreak, updateChallengeProgress, awardBadge } from '../utils/gamification.js';
import { getOrCreateUser } from '../utils/userService.js';
import { logger } from '../config/logger.js';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

/** UUID v4 format regex for input ID sanitization. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Require auth for all footprint endpoints
router.use(requireAuth);

/**
 * GET /api/footprint
 * Retrieves all footprint entries for the authenticated user,
 * ordered by date descending.
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const entries = await db.query.footprintEntries.findMany({
      where: eq(footprintEntries.userId, userId),
      orderBy: [desc(footprintEntries.entryDate), desc(footprintEntries.createdAt)],
    });

    res.json(entries.map(e => {
      let parsed = {};
      try {
        parsed = e.metadata ? JSON.parse(e.metadata) : {};
      } catch (err) {
        logger.error('Failed to parse footprint entry metadata', { id: e.id, metadata: e.metadata, error: err });
      }
      return {
        ...e,
        metadata: parsed,
      };
    }));
  } catch (error: unknown) {
    logger.error('Error fetching footprint entries', { error });
    res.status(500).json({ error: 'Failed to fetch footprint entries' });
  }
});

/**
 * POST /api/footprint
 * Creates a new footprint log entry, triggers gamification updates
 * (streaks, challenge progress, badges), and returns the result.
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const email = req.user!.email;

    // Ensure the user exists in SQLite before adding dependent records
    await getOrCreateUser(userId, email);

    // Validate request body
    const validationResult = footprintEntrySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors[0].message });
    }

    const { entryDate, category, inputValue, inputUnit, subCategory, notes } = validationResult.data;

    // Execute carbon calculation logic
    const calcResult = calculateCarbon(category, subCategory, inputValue);

    const entryId = crypto.randomUUID();
    const metadataStr = JSON.stringify({
      subCategory,
      notes: notes || '',
      calculatedUnit: calcResult.unit,
    });

    // Write log entry to SQLite
    await db.insert(footprintEntries).values({
      id: entryId,
      userId,
      entryDate,
      category,
      inputValue,
      inputUnit,
      carbonCo2eKg: calcResult.carbonCo2eKg,
      metadata: metadataStr,
    });

    // Proactively check and register the First Log badge
    await awardBadge(userId, 'first_calculation');

    // Trigger Gamification - update user streaks and active challenge progress
    const streakResult = await checkAndUpdateStreak(userId, entryDate);
    const completedChallenges = await updateChallengeProgress(userId, category, subCategory, inputValue);

    res.status(201).json({
      message: 'Footprint entry logged successfully',
      entry: {
        id: entryId,
        userId,
        entryDate,
        category,
        inputValue,
        inputUnit,
        carbonCo2eKg: calcResult.carbonCo2eKg,
        metadata: { subCategory, notes },
      },
      gamification: {
        streakUpdated: streakResult.streakUpdated,
        pointsAwarded: streakResult.pointsAwarded,
        completedChallenges,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to log footprint entry';
    logger.error('Error logging footprint entry', { error });
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/footprint/:id
 * Removes a footprint entry by UUID, verifying ownership first.
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user!.uid;
    const entryId = req.params.id;

    // Validate UUID format to prevent injection
    if (!UUID_REGEX.test(entryId)) {
      return res.status(400).json({ error: 'Invalid entry ID format' });
    }

    // Check if the log belongs to this user
    const existing = await db.query.footprintEntries.findFirst({
      where: and(
        eq(footprintEntries.id, entryId),
        eq(footprintEntries.userId, userId)
      ),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Footprint entry not found or unauthorized' });
    }

    await db.delete(footprintEntries)
      .where(eq(footprintEntries.id, entryId));

    res.json({ message: 'Footprint entry deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error deleting footprint entry', { error });
    res.status(500).json({ error: 'Failed to delete footprint entry' });
  }
});

export default router;
