import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default database path if not provided in environment variables
const dbPath = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL.replace('file:', '') 
  : path.join(__dirname, '../../app.db');

const sqlite = new Database(dbPath);

// Enable WAL (Write-Ahead Logging) mode to handle concurrent operations safely in SQLite
sqlite.pragma('journal_mode = WAL');

// Enable foreign key enforcement (off by default in SQLite)
sqlite.pragma('foreign_keys = ON');

/**
 * Auto-create all required tables on startup if they don't exist.
 * This ensures the database is always ready, even on fresh deployments
 * where `drizzle-kit push` hasn't been run separately.
 */
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    points INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT
  );

  CREATE TABLE IF NOT EXISTS footprint_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date TEXT NOT NULL,
    category TEXT NOT NULL,
    input_value REAL NOT NULL,
    input_unit TEXT NOT NULL,
    carbon_co2e_kg REAL NOT NULL,
    metadata TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  CREATE INDEX IF NOT EXISTS footprint_user_id_idx ON footprint_entries(user_id);
  CREATE INDEX IF NOT EXISTS footprint_entry_date_idx ON footprint_entries(entry_date);
  CREATE INDEX IF NOT EXISTS footprint_user_entry_date_idx ON footprint_entries(user_id, entry_date);

  CREATE TABLE IF NOT EXISTS user_challenges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    progress REAL NOT NULL DEFAULT 0.0,
    started_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    completed_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS challenges_user_id_idx ON user_challenges(user_id);
  CREATE INDEX IF NOT EXISTS challenges_user_status_idx ON user_challenges(user_id, status);

  CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    awarded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  CREATE INDEX IF NOT EXISTS achievements_user_id_idx ON user_achievements(user_id);

  CREATE TABLE IF NOT EXISTS offset_purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    offset_amount_co2e_kg REAL NOT NULL,
    cost_simulated_currency REAL NOT NULL,
    purchased_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  CREATE INDEX IF NOT EXISTS offsets_user_id_idx ON offset_purchases(user_id);
  CREATE INDEX IF NOT EXISTS offsets_user_purchased_idx ON offset_purchases(user_id, purchased_at);

  CREATE TABLE IF NOT EXISTS user_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    target_value REAL NOT NULL,
    target_month TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
  CREATE INDEX IF NOT EXISTS goals_user_id_idx ON user_goals(user_id);
  CREATE INDEX IF NOT EXISTS goals_user_target_month_idx ON user_goals(user_id, target_month);
`);

export const db = drizzle(sqlite, { schema });
