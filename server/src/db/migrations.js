import { query } from './pool.js';

/**
 * Executes database migrations to create necessary tables and indexes.
 * Uses parameterized and safe DDL queries with IF NOT EXISTS.
 */
export async function runMigrations() {
  const createRepositoriesTable = `
    CREATE TABLE IF NOT EXISTS repositories (
      id BIGINT PRIMARY KEY,
      owner VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      html_url TEXT NOT NULL,
      stars_count INT DEFAULT 0,
      forks_count INT DEFAULT 0,
      open_issues_count INT DEFAULT 0,
      language VARCHAR(100),
      default_branch VARCHAR(100) DEFAULT 'main',
      raw_metadata JSONB,
      last_synced_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
  `;

  const createSnapshotsTable = `
    CREATE TABLE IF NOT EXISTS analytics_snapshots (
      id SERIAL PRIMARY KEY,
      repository_full_name VARCHAR(255) NOT NULL,
      snapshot_type VARCHAR(50) NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_snapshots_repo_type ON analytics_snapshots(repository_full_name, snapshot_type);
  `;

  try {
    const res1 = await query(createRepositoriesTable);
    const res2 = await query(createSnapshotsTable);

    if (res1 !== null && res2 !== null) {
      console.log('[PostgreSQL] Database migrations completed successfully.');
      return true;
    } else {
      console.log('[PostgreSQL] Database not configured or unreachable; skipped migrations.');
      return false;
    }
  } catch (err) {
    console.warn(`[PostgreSQL Migration Warning] ${err.message}`);
    return false;
  }
}
