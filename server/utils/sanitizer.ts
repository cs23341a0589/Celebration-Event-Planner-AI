/**
 * Data Sanitization & Hygiene Utility
 * Enforces zero-crash payloads, undefined-stripping, and safe string handling.
 */

export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (value === undefined) {
        return undefined; // JSON.stringify omits keys with undefined values
      }
      return value;
    })
  );
}

export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .replace(/[<>]/g, '') // Basic anti-XSS stripping
    .slice(0, 10000); // Prevent unbounded buffer exhaustion
}

export function sanitizeNumber(input: unknown, defaultValue: number = 0): number {
  if (typeof input === 'number' && !isNaN(input)) {
    return input;
  }
  if (typeof input === 'string') {
    const parsed = parseFloat(input.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}
