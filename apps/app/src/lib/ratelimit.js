/**
 * Einfaches In-Memory Rate-Limiting (sliding window).
 * Für Multi-Instance-Deployments sollte hier ein Redis-Backend angebunden werden –
 * dokumentiert in docs/security.md.
 */

const buckets = new Map();

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = [];
    buckets.set(key, bucket);
  }
  // Alte Einträge entfernen
  while (bucket.length && bucket[0] < now - windowMs) bucket.shift();
  if (bucket.length >= limit) {
    const retryAfterMs = windowMs - (now - bucket[0]);
    return { allowed: false, retryAfterMs, remaining: 0 };
  }
  bucket.push(now);
  return { allowed: true, remaining: limit - bucket.length };
}

export function resetRateLimit(key) {
  buckets.delete(key);
}
