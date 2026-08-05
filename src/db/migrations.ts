import type { Database } from 'sql.js';

const migrations: Array<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL DEFAULT 0,
        birthday TEXT NOT NULL,
        points_total INTEGER NOT NULL DEFAULT 0,
        avatar_url TEXT NOT NULL DEFAULT '',
        points_history TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        minimum_age INTEGER NOT NULL DEFAULT 0,
        points INTEGER NOT NULL DEFAULT 1,
        recurrence TEXT NOT NULL CHECK (recurrence IN ('none', 'daily', 'weekly')) DEFAULT 'weekly',
        color TEXT NOT NULL DEFAULT '#1976d2',
        fixed_child_id INTEGER NULL REFERENCES children(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS child_chore_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
        due_date TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        completion_timestamp TEXT NULL,
        points_awarded INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON child_chore_assignments(due_date);
      CREATE INDEX IF NOT EXISTS idx_assignments_child ON child_chore_assignments(child_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_unique_active
        ON child_chore_assignments(chore_id, due_date);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS calendar_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('google', 'ics')),
        url TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT '#607d8b',
        enabled INTEGER NOT NULL DEFAULT 1,
        last_synced_at TEXT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS calendar_event_cache (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL CHECK (source IN ('google', 'ics')),
        subscription_id INTEGER NULL REFERENCES calendar_subscriptions(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        all_day INTEGER NOT NULL DEFAULT 0,
        color TEXT NOT NULL DEFAULT '#607d8b'
      );
    `,
  },
];

export function runMigrations(db: Database): void {
  db.run('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const result = db.exec('SELECT version FROM schema_migrations');
  const applied = new Set((result[0]?.values ?? []).map((row) => Number(row[0])));

  migrations.forEach((migration) => {
    if (applied.has(migration.version)) return;
    db.run('BEGIN');
    try {
      db.run(migration.sql);
      db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
        migration.version,
        new Date().toISOString(),
      ]);
      db.run('COMMIT');
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  });
}
