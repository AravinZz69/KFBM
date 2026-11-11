import { query } from './db';

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetSeconds: number;
}

// In-memory sliding window cache for fast checks
interface WindowRecord {
  timestamps: number[];
}
const memoryCache = new Map<string, WindowRecord>();

/**
 * Basic rate limiting on student submission API.
 * Allowed: maxRequests (e.g. 10) per windowSeconds (e.g. 600s = 10 mins) per IP or identifier.
 */
export async function checkRateLimit(
  identifier: string,
  action: string = 'submit_feedback',
  maxRequests: number = 10,
  windowSeconds: number = 600
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  // 1. Fast in-memory check
  const cacheKey = `${action}:${identifier}`;
  let record = memoryCache.get(cacheKey);

  if (!record) {
    record = { timestamps: [] };
    memoryCache.set(cacheKey, record);
  }

  // Filter out expired timestamps
  record.timestamps = record.timestamps.filter(ts => ts > cutoff);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  // Record this attempt in memory
  record.timestamps.push(now);

  // 2. Neon DB persistence for rate limiting
  try {
    await query(
      `INSERT INTO rate_limits (identifier, action, created_at)
       VALUES ($1, $2, NOW())`,
      [identifier.slice(0, 100), action]
    );

    // Occasional cleanup of old records (> 2 hours old)
    if (Math.random() < 0.05) {
      query(`DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '2 hours'`).catch(() => {});
    }
  } catch (err) {
    // Non-blocking fallback to memory if DB table has transient error
    console.error('Rate limit DB log error:', err);
  }

  return {
    success: true,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: windowSeconds,
  };
}
