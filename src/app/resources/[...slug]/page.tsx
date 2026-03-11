'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type AccessLevel = 'free' | 'trial' | 'active' | 'lifetime';
type UserStatus = 'active' | 'trialing' | 'canceled_with_access' | 'lifetime' | 'no_subscription';

interface AuthData {
  authenticated: boolean;
  email?: string;
  status?: UserStatus;
}

interface GatingInfo {
  requiredLevel: AccessLevel;
  reason?: string;
}

interface PageData {
  title: string;
  slug: string;
  fullSlug: string;
  content: string;
  isSection?: boolean;
  children?: { title: string; fullSlug: string }[];
  gating?: GatingInfo;
}

// Check if user has access to content
function hasAccess(userStatus: UserStatus | undefined, requiredLevel: AccessLevel): boolean {
  if (requiredLevel === 'free') return true;
  if (!userStatus || userStatus === 'no_subscription') return false;

  const statusToLevel: Record<UserStatus, number> = {
    'no_subscription': 0,
    'trialing': 1,
    'canceled_with_access': 2,
    'active': 3,
    'lifetime': 4,
  };

  const levelToNumber: Record<AccessLevel, number> = {
    'free': 0,
    'trial': 1,
    'active': 3,
    'lifetime': 4,
  };

  return statusToLevel[userStatus] >= levelToNumber[requiredLevel];
}

function getLockedMessage(requiredLevel: AccessLevel): string {
  switch (requiredLevel) {
    case 'active':
      return 'This content is available for active members only.';
    case 'lifetime':
      return 'This content is exclusive to lifetime members.';
    case 'trial':
      return 'Please log in to access this content.';
    default:
      return 'You do not have access to this content.';
  }
}

export default function ResourcePage() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();

  // Get the slug from the URL
  const slugParts = params.slug as string[];
  const fullSlug = slugParts ? slugParts.join('/') : '';

  useEffect(() => {
    async function init() {
      // Check auth
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

      // Load page content
      if (fullSlug) {
        try {
          const pageRes = await fetch(`/api/content/page?slug=${encodeURIComponent(fullSlug)}`);

          if (!pageRes.ok) {
            setError('Page not found');
            setLoading(false);
            return;
          }

          const pageData = await pageRes.json();
          setPage(pageData);
        } catch (e) {
          console.error('Failed to load page:', e);
          setError('Failed to load page');
        }
      }

      setLoading(false);
    }
    init();
  }, [router, fullSlug]);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1F35] via-[#152d4a] to-[#0D1F35] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-white/30 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white/70 font-medium">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!auth?.authenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0D1F35] text-white sticky top-0 z-50 shadow-lg shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/resources">
                <img
                  src="/icon.png"
                  alt="CCG"
                  className="w-9 h-9 rounded-lg object-cover hover:opacity-80"
                />
              </Link>
              <div className="flex items-center gap-2 text-sm">
                <Link href="/resources" className="text-gray-400 hover:text-white">
                  Resources
                </Link>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-200 truncate max-w-[250px]">
                  {page?.title || 'Loading...'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Back button */}
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0D1F35] mb-6 group"
        >
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#0D1F35] group-hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span>Back to Resources</span>
        </Link>

        {error ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                The resource you are looking for does not exist or has been moved.
              </p>
              <Link
                href="/resources"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D1F35] text-white rounded-xl hover:bg-[#1a3a5c] font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Resources
              </Link>
            </div>
          </div>
        ) : page && page.gating && !hasAccess(auth?.status, page.gating.requiredLevel) ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{page.title}</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {page.gating.reason || getLockedMessage(page.gating.requiredLevel)}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Requires: {page.gating.requiredLevel === 'active' ? 'Active Membership' :
                          page.gating.requiredLevel === 'lifetime' ? 'Lifetime Membership' :
                          'Login'}
              </div>
            </div>
          </div>
        ) : page ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Page Header */}
            <div className="border-b border-gray-100 px-6 sm:px-8 py-6 bg-gradient-to-r from-gray-50 to-white">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{page.title}</h1>
            </div>

            {/* Page Content */}
            <div className="px-6 sm:px-8 py-8">
              {/* If this is a section with children, show them first */}
              {page.isSection && page.children && page.children.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#0D1F35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    In this section
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {page.children.map((child) => (
                      <Link
                        key={child.fullSlug}
                        href={`/resources/${child.fullSlug}`}
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#0D1F35] hover:bg-gray-50/50 group"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#0D1F35] group-hover:text-white">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 group-hover:text-[#0D1F35] font-medium">{child.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Markdown Content */}
              <div
                className="prose prose-gray max-w-none
                  prose-headings:text-gray-900
                  prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4
                  prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-lg prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-gray-600 prose-p:leading-relaxed
                  prose-a:text-blue-600 prose-a:underline prose-a:font-medium hover:prose-a:text-blue-800
                  prose-ul:text-gray-600 prose-ol:text-gray-600
                  prose-li:my-1
                  prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl
                  prose-blockquote:border-l-4 prose-blockquote:border-[#0D1F35] prose-blockquote:bg-gray-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-img:rounded-xl prose-img:shadow-lg
                  prose-hr:border-gray-200
                  prose-strong:text-gray-900
                  [&_.callout]:bg-blue-50 [&_.callout]:border-l-4 [&_.callout]:border-blue-500 [&_.callout]:p-4 [&_.callout]:my-4 [&_.callout]:rounded-r-lg
                  [&_.table-wrapper]:overflow-x-auto [&_.table-wrapper]:my-6
                  [&_table]:w-full [&_table]:border-collapse [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:border [&_table]:border-gray-200
                  [&_th]:bg-[#0D1F35] [&_th]:text-white [&_th]:font-semibold [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-sm
                  [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-gray-100 [&_td]:text-gray-600 [&_td]:text-sm
                  [&_tr:last-child_td]:border-b-0
                  [&_tr:nth-child(even)_td]:bg-gray-50
                  [&_.checkbox]:text-lg [&_.checkbox.checked]:text-green-500 [&_.checkbox.unchecked]:text-gray-400
                "
                dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content, page.title) }}
              />
            </div>

            {/* Footer navigation */}
            <div className="border-t border-gray-100 px-6 sm:px-8 py-4 bg-gray-50/50">
              <Link
                href="/resources"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0D1F35]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Resource Library
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

// Simple markdown to HTML converter
function renderMarkdown(markdown: string, pageTitle?: string): string {
  let html = markdown;

  // Remove ALL H1s at the start that match the page title (avoid duplicate headers)
  if (pageTitle) {
    const titleLower = pageTitle.toLowerCase();
    // Keep removing matching H1s from the start
    while (true) {
      const h1Match = html.match(/^\s*#\s+(.+?)(\n|$)/);
      if (h1Match && h1Match[1].trim().toLowerCase() === titleLower) {
        html = html.replace(/^\s*#\s+.+?\n?/, '');
      } else {
        break;
      }
    }
  }

  // Tables - must be processed before other elements
  html = html.replace(/(\|[^\n]+\|\n)+/g, (match) => {
    const rows = match.trim().split('\n').filter(row => row.trim());
    if (rows.length < 2) return match;

    let tableHtml = '<div class="table-wrapper"><table>';
    rows.forEach((row, index) => {
      // Skip separator row (contains ---)
      if (row.match(/^\|[\s\-:]+\|$/)) return;

      const cells = row.split('|').filter((cell, i, arr) => i > 0 && i < arr.length - 1);
      const tag = index === 0 ? 'th' : 'td';
      const rowClass = index === 0 ? ' class="table-header"' : '';

      tableHtml += `<tr${rowClass}>`;
      cells.forEach(cell => {
        tableHtml += `<${tag}>${cell.trim()}</${tag}>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</table></div>';
    return tableHtml;
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Checkboxes
  html = html.replace(/- \[ \]/g, '<span class="checkbox unchecked">☐</span>');
  html = html.replace(/- \[x\]/gi, '<span class="checkbox checked">☑</span>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.slice(3, -3).trim();
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });

  // Unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>');

  // Blockquotes
  html = html.replace(/^>\s*(.*$)/gim, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr />');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<hr \/>)/g, '$1');
  html = html.replace(/(<hr \/>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<div)/g, '$1');
  html = html.replace(/(<\/div>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<table)/g, '$1');
  html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
