import { db } from '../config/db.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { DBUser } from '../db/schema.js';

/**
 * Retrieves an existing user by Firebase UID, or creates a new one if not found.
 * This "Just-In-Time" (JIT) user creation ensures the SQLite database always has
 * a matching user record for any authenticated Firebase user.
 *
 * @param uid - The Firebase UID of the user.
 * @param email - The user's email address (used for auto-creation).
 * @returns The existing or newly created user record.
 */
export async function getOrCreateUser(uid: string, email: string): Promise<DBUser> {
  let user = await db.query.users.findFirst({
    where: eq(users.id, uid),
  });

  if (!user) {
    const displayName = email.split('@')[0];
    await db.insert(users).values({
      id: uid,
      email,
      displayName,
      points: 0,
      currentStreak: 0,
    }).onConflictDoNothing();

    user = await db.query.users.findFirst({
      where: eq(users.id, uid),
    });
  }

  return user!;
}
