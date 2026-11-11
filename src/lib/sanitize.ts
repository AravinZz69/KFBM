/**
 * Sanitizes input strings against Cross-Site Scripting (XSS).
 * Strips HTML tags, script injection patterns, and dangerous attributes.
 * Pure TypeScript implementation with zero external dependencies (no JSDOM crashes on Vercel).
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  let cleaned = input;

  // 1. Remove dangerous script and style elements and everything inside them
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Remove all HTML tags
  cleaned = cleaned.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');

  // 3. Remove javascript:, vbscript:, and data: URI schemes
  cleaned = cleaned.replace(/(javascript|vbscript|data):/gi, '');

  // 4. Remove inline event handlers (e.g. onload, onclick, onerror)
  cleaned = cleaned.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  return cleaned.trim();
}

/**
 * Sanitizes an object containing key-value string fields
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => (typeof item === 'string' ? sanitizeInput(item) : item));
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
