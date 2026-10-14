/**
 * Client cache module with:
 * 1. In-memory Map storage
 * 2. Optional localStorage backup for public documents
 * 3. TTL management (default 10 minutes)
 * 4. In-flight request deduplication
 *
 * NOTE: Used ONLY for public data (catalog, novel documents, plans, site settings).
 * Chapter bodies are strictly memoryOnly.
 * User-specific data is NEVER stored in localStorage.
 */

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_PREFIX = 'hebr_pub_cache_';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class ClientCache {
  private memoryMap = new Map<string, CacheEntry<unknown>>();
  private inFlightMap = new Map<string, Promise<unknown>>();

  /**
   * Fetch a value from cache or execute fetcher with deduplication.
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttlMs?: number;
      memoryOnly?: boolean;
    }
  ): Promise<T> {
    const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
    const now = Date.now();

    // 1. Check in-memory map
    const memEntry = this.memoryMap.get(key) as CacheEntry<T> | undefined;
    if (memEntry && memEntry.expiresAt > now) {
      return memEntry.value;
    }

    // 2. Check localStorage (if not memoryOnly)
    if (!options?.memoryOnly) {
      try {
        const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (stored) {
          const parsed = JSON.parse(stored) as CacheEntry<T>;
          if (parsed && parsed.expiresAt > now) {
            // Repopulate memory cache
            this.memoryMap.set(key, parsed);
            return parsed.value;
          }
          // Expired, clear it
          localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        }
      } catch {
        // localStorage might be unavailable or disabled (safari private mode, etc.)
      }
    }

    // 3. Deduplicate in-flight promises
    const existingPromise = this.inFlightMap.get(key) as Promise<T> | undefined;
    if (existingPromise) {
      return existingPromise;
    }

    // 4. Execute fetcher
    const promise = (async () => {
      try {
        const result = await fetcher();
        const entry: CacheEntry<T> = {
          value: result,
          expiresAt: Date.now() + ttl,
        };

        // Cache in memory
        this.memoryMap.set(key, entry);

        // Cache in localStorage if public and not memoryOnly
        if (!options?.memoryOnly) {
          try {
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
          } catch {
            // Quota exceeded or disabled
          }
        }

        return result;
      } finally {
        this.inFlightMap.delete(key);
      }
    })();

    this.inFlightMap.set(key, promise);
    return promise;
  }

  /**
   * Set a cache value directly.
   */
  set<T>(key: string, value: T, options?: { ttlMs?: number; memoryOnly?: boolean }): void {
    const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl,
    };
    this.memoryMap.set(key, entry);

    if (!options?.memoryOnly) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
      } catch {
        // ignore
      }
    }
  }

  /**
   * Invalidate a single key or all keys matching a prefix.
   */
  invalidate(keyOrPrefix: string): void {
    // Invalidate from memory
    for (const k of this.memoryMap.keys()) {
      if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) {
        this.memoryMap.delete(k);
      }
    }

    // Invalidate from localStorage
    try {
      const storagePrefix = `${STORAGE_PREFIX}${keyOrPrefix}`;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === `${STORAGE_PREFIX}${keyOrPrefix}` || k.startsWith(storagePrefix))) {
          toRemove.push(k);
        }
      }
      for (const k of toRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.memoryMap.clear();
    this.inFlightMap.clear();
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          toRemove.push(k);
        }
      }
      for (const k of toRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
  }
}

export const clientCache = new ClientCache();
