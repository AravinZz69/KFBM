import { neon } from '@neondatabase/serverless';

/**
 * Resolves the database connection string from environment variables.
 * Supports standard Vercel Postgres aliases (DATABASE_URL, POSTGRES_URL, etc.)
 * and safely strips any surrounding quotes or whitespace that may occur when pasting into Vercel.
 */
export function getDatabaseUrl(): string {
  const raw =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.NEON_DATABASE_URL ||
    '';

  return raw.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Executes a parameterized query using Neon serverless SQL.
 * Includes automatic retry on transient socket closures (UND_ERR_SOCKET).
 * NEVER concatenate raw user strings into SQL queries.
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing. Please set DATABASE_URL or POSTGRES_URL in Vercel settings.');
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
