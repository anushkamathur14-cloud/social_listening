import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./data/demo.db";

mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      market TEXT NOT NULL,
      severity TEXT NOT NULL,
      payload TEXT NOT NULL,
      detected_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS triggers (
      id TEXT PRIMARY KEY,
      signal_id TEXT NOT NULL,
      type TEXT NOT NULL,
      market TEXT NOT NULL,
      rule TEXT NOT NULL,
      fired_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS creatives (
      id TEXT PRIMARY KEY,
      trigger_id TEXT NOT NULL,
      persona TEXT NOT NULL,
      market TEXT NOT NULL,
      headline TEXT NOT NULL,
      copy TEXT NOT NULL,
      cta TEXT NOT NULL,
      image_prompt TEXT NOT NULL,
      signal_context TEXT NOT NULL,
      attribution TEXT NOT NULL,
      compliance_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      creative_id TEXT NOT NULL,
      trigger_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      status TEXT NOT NULL,
      budget REAL NOT NULL,
      targeting TEXT NOT NULL,
      market TEXT NOT NULL,
      launched_at TEXT
    );
    CREATE TABLE IF NOT EXISTS performance (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      impressions INTEGER NOT NULL,
      clicks INTEGER NOT NULL,
      ctr REAL NOT NULL,
      cpa REAL NOT NULL,
      spend REAL NOT NULL,
      recorded_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      trigger_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      stage_timings TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrations for new columns
  const migrations = [
    "ALTER TABLE creatives ADD COLUMN channel TEXT DEFAULT 'meta'",
    "ALTER TABLE creatives ADD COLUMN image_url TEXT",
    "ALTER TABLE creatives ADD COLUMN description TEXT",
    "ALTER TABLE campaigns ADD COLUMN channel TEXT DEFAULT 'meta'",
    "ALTER TABLE campaigns ADD COLUMN publish_adapter TEXT",
  ];
  for (const sql of migrations) {
    try {
      sqlite.exec(sql);
    } catch {
      // column already exists
    }
  }
}
