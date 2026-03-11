import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface NavItem {
  title: string;
  slug: string;
  fullSlug: string;
  children?: NavItem[];
  type?: string;
  childCount?: number;
}

export interface PageData {
  title: string;
  slug: string;
  fullSlug: string;
  content: string;
  isSection?: boolean;
  children?: NavItem[];
}

export interface PageIndexEntry {
  slug: string;
  title: string;
  isSection: boolean;
  chunk: number;
}

// Cache for loaded data
let navigationCache: NavItem[] | null = null;
let pageIndexCache: PageIndexEntry[] | null = null;
const pageCache: Map<string, PageData> = new Map();

export function getNavigation(): NavItem[] {
  if (navigationCache) return navigationCache;

  try {
    const navPath = path.join(CONTENT_DIR, 'navigation.json');
    const data = fs.readFileSync(navPath, 'utf-8');
    navigationCache = JSON.parse(data);
    return navigationCache || [];
  } catch (error) {
    console.error('Error loading navigation:', error);
    return [];
  }
}

export function getPageIndex(): PageIndexEntry[] {
  if (pageIndexCache) return pageIndexCache;

  try {
    const indexPath = path.join(CONTENT_DIR, 'page-index.json');
    const data = fs.readFileSync(indexPath, 'utf-8');
    pageIndexCache = JSON.parse(data);
    return pageIndexCache || [];
  } catch (error) {
    console.error('Error loading page index:', error);
    return [];
  }
}

export function getPage(slug: string): PageData | null {
  // Check cache first
  if (pageCache.has(slug)) {
    return pageCache.get(slug) || null;
  }

  // Find the page in the index
  const index = getPageIndex();
  let entry = index.find(e => e.slug === slug);

  if (!entry) {
    // Navigation uses slugs without Notion IDs, but page-index has them
    // Try to find a page whose slug starts with the requested slug + hyphen + Notion ID
    const notionIdPattern = /^(.+)-([a-f0-9]{32})$/;
    entry = index.find(e => {
      const match = e.slug.match(notionIdPattern);
      if (match) {
        // e.slug is "some-title-notionid", check if "some-title" matches our slug
        return match[1] === slug;
      }
      return false;
    });
  }

  if (!entry) {
    // Try nested path matching - navigation might send "parent/child-id"
    // but page-index might have "parent-parentid/child-id"
    const slugParts = slug.split('/');
    if (slugParts.length > 1) {
      // For nested paths, try matching the last part
      const lastPart = slugParts[slugParts.length - 1];
      entry = index.find(e => e.slug.endsWith('/' + lastPart) || e.slug === lastPart);
    }
  }

  if (!entry) {
    // Final fallback: try to find by partial match (for nested slugs)
    const partialMatch = index.find(e => e.slug.endsWith(slug) || slug.endsWith(e.slug));
    if (!partialMatch) return null;
    return getPage(partialMatch.slug);
  }

  // Load the chunk containing this page
  try {
    const chunkPath = path.join(CONTENT_DIR, `pages-${entry.chunk}.json`);
    const data = fs.readFileSync(chunkPath, 'utf-8');
    const chunk = JSON.parse(data);

    // Find the page in the chunk using the entry's slug (which may differ from input slug)
    const page = chunk[entry.slug];
    if (page) {
      pageCache.set(entry.slug, page);
      // Also cache the original slug for faster future lookups
      if (slug !== entry.slug) {
        pageCache.set(slug, page);
      }
      return page;
    }

    return null;
  } catch (error) {
    console.error('Error loading page:', error);
    return null;
  }
}

export function searchPages(query: string, limit = 20): PageIndexEntry[] {
  const index = getPageIndex();
  const lowerQuery = query.toLowerCase();

  return index
    .filter(entry => entry.title.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}

export function getPageByFullSlug(fullSlug: string): PageData | null {
  const index = getPageIndex();
  const entry = index.find(e => e.slug === fullSlug);

  if (!entry) return null;
  return getPage(entry.slug);
}
