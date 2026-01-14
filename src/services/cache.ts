import { Cache } from "@raycast/api";
import { DocEntry } from "../types/DocEntry";
import { DjangoVersion } from "../constants";

/**
 * Cacheable format stores URLs instead of object references to avoid circular JSON.
 */
interface CacheableEntry {
  url: string;
  title: string;
  content: string;
  parentUrl: string | null;
  previousUrl: string | null;
  nextUrl: string | null;
}

interface CachedData {
  entries: CacheableEntry[];
  lastRefresh: number;
}

const cache = new Cache();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getCacheKey(version: DjangoVersion): string {
  return `django-docs-${version}`;
}

export function readCache(version: DjangoVersion): DocEntry[] | null {
  const data = cache.get(getCacheKey(version));
  if (!data) {
    return null;
  }

  try {
    const cached: CachedData = JSON.parse(data);

    // Create DocEntry objects with null references initially
    const entries: DocEntry[] = cached.entries.map((c) => ({
      url: c.url,
      title: c.title,
      content: c.content,
      parent: null,
      previous: null,
      next: null,
    }));

    // Build map for O(1) lookups
    const entryByUrl = new Map<string, DocEntry>(entries.map((e) => [e.url, e]));

    // Reconstruct object references from URLs
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const c = cached.entries[i];
      entry.parent = c.parentUrl ? (entryByUrl.get(c.parentUrl) ?? null) : null;
      entry.previous = c.previousUrl ? (entryByUrl.get(c.previousUrl) ?? null) : null;
      entry.next = c.nextUrl ? (entryByUrl.get(c.nextUrl) ?? null) : null;
    }

    return entries;
  } catch {
    return null;
  }
}

export function writeCache(version: DjangoVersion, entries: DocEntry[]): void {
  // Convert to cacheable format (URLs instead of object refs)
  const cacheable: CacheableEntry[] = entries.map((e) => ({
    url: e.url,
    title: e.title,
    content: e.content,
    parentUrl: e.parent?.url ?? null,
    previousUrl: e.previous?.url ?? null,
    nextUrl: e.next?.url ?? null,
  }));

  const data: CachedData = {
    entries: cacheable,
    lastRefresh: Date.now(),
  };

  cache.set(getCacheKey(version), JSON.stringify(data));
}

export function getCacheAge(version: DjangoVersion): number | null {
  const data = cache.get(getCacheKey(version));
  if (!data) {
    return null;
  }

  try {
    const cached: CachedData = JSON.parse(data);
    return Date.now() - cached.lastRefresh;
  } catch {
    return null;
  }
}

export function shouldRefresh(version: DjangoVersion, maxAgeMs: number = SEVEN_DAYS_MS): boolean {
  const age = getCacheAge(version);

  if (age === null) {
    return true; // No cache exists
  }

  return age > maxAgeMs;
}

export function getLastRefreshDate(version: DjangoVersion): Date | null {
  const data = cache.get(getCacheKey(version));
  if (!data) {
    return null;
  }

  try {
    const cached: CachedData = JSON.parse(data);
    return new Date(cached.lastRefresh);
  } catch {
    return null;
  }
}
