import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Ensure DATABASE_URL is read strictly from environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not defined in environment variables.');
}

// Singleton Neon query client
let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  if (!sqlClient) {
    sqlClient = neon(url);
  }
  return sqlClient;
}

/**
 * Executes a parameterized query using Neon serverless SQL.
 * NEVER concatenate raw user strings into SQL queries.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const sql = getDb();
  const rows = await sql.query(text, params);
  return rows as T[];
}

/**
 * Helper to fetch a single row or null.
 */
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
