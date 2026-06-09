import { db } from '../config/db.js';
import { users, userChallenges, userAchievements } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { ECO_CHALLENGES } from '@carbon/shared';

export async function checkAndUpdateStreak(userId: string, todayStr: string): Promise<{ streakUpdated: boolean; pointsAwarded: number }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) return { streakUpdated: false, pointsAwarded: 0 };

  const lastActive = user.lastActiveDate;
  let newStreak = user.currentStreak;
  let pointsAwarded = 0;

  if (!lastActive) {
    newStreak = 1;
    pointsAwarded = 50; // Welcome points
  } else if (lastActive === todayStr) {
    // Already active today, streak remains same
  } else {
    // Parse dates manually to avoid timezone shifting
    const [lastYear, lastMonth, lastDay] = lastActive.split('-').map(Number);
    const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
    
    const lastDate = new Date(lastYear, lastMonth - 1, lastDay);
    const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
    
    const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak += 1;
      pointsAwarded = 10 + (newStreak % 7 === 0 ? 50 : 0); // Bonus point every 7 days
    } else if (diffDays > 1) {
      newStreak = 1;
      pointsAwarded = 10;
    }
  }

  // Always reward at least 10 points for the first log of a new day
  if (lastActive !== todayStr && pointsAwarded === 0) {
    pointsAwarded = 10;
  }

  await db.update(users)
    .set({
      currentStreak: newStreak,
      lastActiveDate: todayStr,
      points: sql`${users.points} + ${pointsAwarded}`
    })
    .where(eq(users.id, userId));

  // Check streak achievements
  if (newStreak === 7) {
    await awardBadge(userId, 'streak_7');
  } else if (newStreak === 30) {
    await awardBadge(userId, 'streak_30');
  }

  return { streakUpdated: lastActive !== todayStr, pointsAwarded };
}

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  // Check if already awarded
  const existing = await db.query.userAchievements.findFirst({
    where: and(
      eq(userAchievements.userId, userId),
      eq(userAchievements.badgeId, badgeId)
    )
  });

  if (existing) return false;

  const id = `${userId}_${badgeId}`;
  await db.insert(userAchievements).values({
    id,
    userId,
    badgeId,
    awardedAt: Math.floor(Date.now() / 1000)
  });

  // Award bonus points for achievement atomically
  await db.update(users)
    .set({ points: sql`${users.points} + 100` }) // 100 points per badge
    .where(eq(users.id, userId));

  return true;
}

export async function updateChallengeProgress(
  userId: string,
  category: 'energy' | 'transport' | 'food' | 'waste',
  subCategory: string,
  value: number
): Promise<string[]> {
  const completedChallengeTitles: string[] = [];

  // Ensure active challenges exist for the user, if not, auto-start them
  const activeChallenges = await db.query.userChallenges.findMany({
    where: and(
      eq(userChallenges.userId, userId),
      eq(userChallenges.status, 'active')
    )
  });

  // If challenges aren't fully initialized, initialize them
  if (activeChallenges.length < ECO_CHALLENGES.length) {
    for (const challenge of ECO_CHALLENGES) {
      const challengeId = challenge.id;
      const id = `${userId}_${challengeId}`;
      await db.insert(userChallenges).values({
        id,
        userId,
        challengeId,
        status: 'active',
        progress: 0
      }).onConflictDoNothing();
    }
  }

  const userActiveChallenges = await db.query.userChallenges.findMany({
    where: and(
      eq(userChallenges.userId, userId),
      eq(userChallenges.status, 'active')
    )
  });

  for (const userChallenge of userActiveChallenges) {
    const config = ECO_CHALLENGES.find(c => c.id === userChallenge.challengeId);
    if (!config) continue;

    let progressIncrement = 0;

    if (config.id === 'meatless_week' && category === 'food') {
      if (subCategory === 'vegetarian' || subCategory === 'vegan') {
        progressIncrement = 1;
      }
    } else if (config.id === 'car_free_commute' && category === 'transport') {
      if (subCategory === 'electric_car' || subCategory === 'bus' || subCategory === 'train') {
        progressIncrement = 1;
      }
    } else if (config.id === 'energy_saver' && category === 'energy') {
      if (value < config.target) {
        progressIncrement = 1; // Complete immediately if it's below the target
      }
    } else if (config.id === 'waste_minimizer' && category === 'waste') {
      if (subCategory === 'recycled') {
        progressIncrement = 1;
      }
    }

    if (progressIncrement > 0) {
      const newProgress = userChallenge.progress + progressIncrement;
      const isCompleted = newProgress >= config.target;

      await db.update(userChallenges)
        .set({
          progress: isCompleted ? config.target : newProgress,
          status: isCompleted ? 'completed' : 'active',
          completedAt: isCompleted ? Math.floor(Date.now() / 1000) : null
        })
        .where(eq(userChallenges.id, userChallenge.id));

      if (isCompleted) {
        completedChallengeTitles.push(config.title);
        // Award points atomically
        await db.update(users)
          .set({ points: sql`${users.points} + ${config.pointsReward}` })
          .where(eq(users.id, userId));
        // Check for Challenge Conqueror Badge
        await awardBadge(userId, 'challenge_conqueror');
      }
    }
  }

  return completedChallengeTitles;
}
