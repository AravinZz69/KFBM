import { neon } from '@neondatabase/serverless';

// Ensure DATABASE_URL is read strictly from environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not defined in environment variables.');
}

/**
 * Executes a parameterized query using Neon serverless SQL.
 * Includes automatic retry on transient socket closures (UND_ERR_SOCKET).
 * NEVER concatenate raw user strings into SQL queries.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  let attempts = 0;
  while (attempts < 3) {
    try {
      const sql = neon(url);
      const rows = await sql.query(text, params);
      return rows as T[];
    } catch (err: any) {
      attempts++;
      const isSocketError =
        err?.message?.includes('fetch failed') ||
        err?.sourceError?.code === 'UND_ERR_SOCKET' ||
        err?.message?.includes('socket') ||
        err?.message?.includes('timeout');

      if (isSocketError && attempts < 3) {
        await new Promise(res => setTimeout(res, 250 * attempts));
        continue;
      }
      throw err;
    }
  }
  return [];
}

/**
 * Helper to fetch a single row or null.
 */
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
