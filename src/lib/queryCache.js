// Lightweight mutation-aware client cache + in-flight request deduplicator.
// Cuts duplicate reads and egress overhead on Supabase Free-Tier Nano without changing component state shapes.

const responseCache = new Map();
const inflightRequests = new Map();
const MAX_CACHE_ENTRIES = 120;

export function getCachedValue(key, ttlMs = 15000) {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > ttlMs) {
    responseCache.delete(key);
    return undefined;
  }
  return entry.data;
}

export function setCachedValue(key, data) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}

export async function cachedQuery(key, fetcher, options = {}) {
  const { ttlMs = 15000, force = false } = options;

  if (!force) {
    const hit = getCachedValue(key, ttlMs);
    if (hit !== undefined) return hit;
  }

  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const promise = Promise.resolve()
    .then(() => fetcher())
    .then((result) => {
      setCachedValue(key, result);
      return result;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, promise);
  return promise;
}

export function invalidateCache(prefix) {
  if (!prefix) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}

export function invalidateAllCache() {
  responseCache.clear();
}
