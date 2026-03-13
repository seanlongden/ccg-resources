'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AuthData {
  authenticated: boolean;
  email?: string;
  status?: string;
}

interface NavSection {
  title: string;
  slug: string;
  description?: string;
  itemCount?: number;
  children?: NavItem[];
}

interface NavItem {
  title: string;
  slug: string;
  fullSlug: string;
  type?: string;
}

interface SearchResult {
  slug: string;
  title: string;
  isSection: boolean;
  chunk: number;
}

const SECTION_ICONS: Record<string, string> = {
  'key-resources': '⭐',
  'get-started': '🚀',
  'outreach': '📬',
  'sales': '🤝',
  'fulfillment': '✅',
  'scale': '📈',
};

export default function ResourcesPage() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [navigation, setNavigation] = useState<NavSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/content/page?search=${encodeURIComponent(query)}`);
      const results = await res.json();
      setSearchResults(results);
    } catch (e) {
      console.error('Search failed:', e);
      setSearchResults([]);
    }
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/auth');
        const authData = await authRes.json();
        if (!authData.authenticated) {
          router.push('/');
          return;
        }
        setAuth(authData);
      } catch (e) {
        console.error('Auth check failed:', e);
        router.push('/');
        return;
      }

      try {
        const navRes = await fetch('/api/content/navigation');
        const navData = await navRes.json();
        setNavigation(navData);
      } catch (e) {
        console.error('Failed to load navigation:', e);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1F35] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto mb-3 text-white/40 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth?.authenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0D1F35] text-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="CCG" className="w-8 h-8" />
              <span className="font-semibold">Resources</span>
            </div>

            <div className="flex-1 max-w-md mx-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60 hidden sm:block">{auth.email}</span>
              <button onClick={handleLogout} className="text-sm text-white/60 hover:text-white">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Results Overlay */}
      {searchQuery && (
        <div className="fixed inset-0 z-40 bg-black/50 pt-14" onClick={() => setSearchQuery('')}>
          <div className="max-w-2xl mx-auto mt-4 px-4" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-6 text-center text-gray-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {searchResults.slice(0, 10).map((result) => (
                    <Link
                      key={result.slug}
                      href={`/resources/${result.slug}`}
                      className="block px-4 py-3 hover:bg-gray-50"
                      onClick={() => setSearchQuery('')}
                    >
                      <p className="font-medium text-gray-900">{result.title}</p>
                      <p className="text-sm text-gray-400 mt-0.5 truncate">{result.slug}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">No results found for &quot;{searchQuery}&quot;</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Member Resource Library</h1>
          <p className="text-gray-500 mt-1">Everything you need to build and grow your agency</p>
        </div>

        {/* 6-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigation.map((section) => (
            <Link
              key={section.slug}
              href={`/resources/${section.slug}`}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-[#0D1F35] hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{SECTION_ICONS[section.slug] || '📄'}</span>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
                  {section.itemCount ?? (section.children?.length ?? 0)} items
                </span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#0D1F35] mb-1.5">
                {section.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {section.description}
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-[#0D1F35] opacity-0 group-hover:opacity-100 transition-opacity">
                View resources
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
