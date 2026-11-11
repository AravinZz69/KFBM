import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes input strings against Cross-Site Scripting (XSS).
 * Trims input and strips HTML tags, script injection patterns, and dangerous attributes.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Strip dangerous HTML/scripts
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Disallow all HTML tags for student feedback
    ALLOWED_ATTR: [],
  });
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
