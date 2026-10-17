import { query } from '../db/pool.js';

export class RepositoryPersistenceService {
  /**
   * Persists or updates repository metadata using parameterized queries.
   * 
   * @param {object} repo - Normalized repository object
   * @returns {Promise<object|null>}
   */
  async upsertRepository(repo) {
    if (!repo || !repo.fullName) return null;

    const sql = `
      INSERT INTO repositories (
        id, owner, name, full_name, description, html_url,
        stars_count, forks_count, open_issues_count, language,
        default_branch, raw_metadata, last_synced_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (full_name) DO UPDATE SET
        stars_count = EXCLUDED.stars_count,
        forks_count = EXCLUDED.forks_count,
        open_issues_count = EXCLUDED.open_issues_count,
        description = EXCLUDED.description,
        language = EXCLUDED.language,
        default_branch = EXCLUDED.default_branch,
        raw_metadata = EXCLUDED.raw_metadata,
        last_synced_at = NOW(),
        updated_at = NOW()
      RETURNING *;
    `;

    const params = [
      repo.id || 0,
      repo.owner?.login || repo.fullName.split('/')[0],
      repo.name || repo.fullName.split('/')[1],
      repo.fullName,
      repo.description || null,
      repo.htmlUrl || `https://github.com/${repo.fullName}`,
      repo.starsCount || 0,
      repo.forksCount || 0,
      repo.openIssuesCount || 0,
      repo.language || null,
      repo.defaultBranch || 'main',
      JSON.stringify(repo),
    ];

    const result = await query(sql, params);
    return result && result.rows ? result.rows[0] : null;
  }

  /**
   * Retrieves persisted repository by full_name.
   * 
   * @param {string} fullName - e.g. "expressjs/express"
   * @returns {Promise<object|null>}
   */
  async getPersistedRepository(fullName) {
    if (!fullName) return null;

    const sql = `SELECT * FROM repositories WHERE LOWER(full_name) = LOWER($1) LIMIT 1;`;
    const result = await query(sql, [fullName]);
    return result && result.rows && result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Saves an analytics snapshot for a repository.
   * 
   * @param {string} fullName - e.g. "expressjs/express"
   * @param {string} snapshotType - 'languages', 'activity', 'contributors', 'frequent_files'
   * @param {object} data - Snapshot payload
   * @returns {Promise<object|null>}
   */
  async saveAnalyticsSnapshot(fullName, snapshotType, data) {
    if (!fullName || !snapshotType || !data) return null;

    const sql = `
      INSERT INTO analytics_snapshots (repository_full_name, snapshot_type, data)
      VALUES ($1, $2, $3)
      RETURNING id, repository_full_name, snapshot_type, created_at;
    `;

    const result = await query(sql, [fullName, snapshotType, JSON.stringify(data)]);
    return result && result.rows ? result.rows[0] : null;
  }

  /**
   * Retrieves the most recent analytics snapshot of a specific type.
   * 
   * @param {string} fullName
   * @param {string} snapshotType
   * @returns {Promise<object|null>}
   */
  async getLatestAnalyticsSnapshot(fullName, snapshotType) {
    if (!fullName || !snapshotType) return null;

    const sql = `
      SELECT data, created_at
      FROM analytics_snapshots
      WHERE LOWER(repository_full_name) = LOWER($1) AND snapshot_type = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const result = await query(sql, [fullName, snapshotType]);
    return result && result.rows && result.rows.length > 0 ? result.rows[0].data : null;
  }
}

export const repositoryPersistenceService = new RepositoryPersistenceService();
