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

interface NavChild {
  title: string;
  slug: string;
  fullSlug?: string;
  type?: string;
  childCount?: number;
  children?: NavChild[];
}

interface NavSection {
  title: string;
  slug: string;
  description?: string;
  children?: NavChild[];
}

const TOP_LEVEL_SLUGS = new Set(['key-resources', 'get-started', 'outreach', 'sales', 'fulfillment', 'scale']);

function hasAccess(userStatus: UserStatus | undefined, requiredLevel: AccessLevel): boolean {
  if (requiredLevel === 'free') return true;
  if (!userStatus || userStatus === 'no_subscription') return false;
  const statusToLevel: Record<UserStatus, number> = {
    'no_subscription': 0, 'trialing': 1, 'canceled_with_access': 2, 'active': 3, 'lifetime': 4,
  };
  const levelToNumber: Record<AccessLevel, number> = {
    'free': 0, 'trial': 1, 'active': 3, 'lifetime': 4,
  };
  return statusToLevel[userStatus] >= levelToNumber[requiredLevel];
}

function getLockedMessage(requiredLevel: AccessLevel): string {
  switch (requiredLevel) {
    case 'active': return 'This content is available for active members only.';
    case 'lifetime': return 'This content is exclusive to lifetime members.';
    default: return 'Please log in to access this content.';
  }
}

export default function ResourcePage() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [page, setPage] = useState<PageData | null>(null);
  const [section, setSection] = useState<NavSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();

  const slugParts = params.slug as string[];
  const fullSlug = slugParts ? slugParts.join('/') : '';
  const isTopLevelSection = TOP_LEVEL_SLUGS.has(fullSlug);

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

      if (isTopLevelSection) {
        // Load navigation to find this section
        try {
          const navRes = await fetch('/api/content/navigation');
          const navData: NavSection[] = await navRes.json();
          const found = navData.find(s => s.slug === fullSlug);
          if (found) {
            setSection(found);
          } else {
            setError('Section not found');
          }
        } catch (e) {
          console.error('Failed to load section:', e);
          setError('Failed to load section');
        }
      } else {
        // Load page content
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
  }, [router, fullSlug, isTopLevelSection]);

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
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/resources">
                <img src="/icon.png" alt="CCG" className="w-8 h-8 shrink-0" />
              </Link>
              <div className="flex items-center gap-1.5 text-sm min-w-0">
                <Link href="/resources" className="text-white/50 hover:text-white shrink-0">Resources</Link>
                <svg className="w-3.5 h-3.5 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-white truncate">
                  {section?.title || page?.title || '...'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-white/50 hover:text-white shrink-0 ml-4"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0D1F35] mb-6 group"
        >
          <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#0D1F35] group-hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          Back to Resources
        </Link>

        {/* Section Overview (one of the 6 top-level sections) */}
        {section && !error && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{section.title}</h1>
              {section.description && (
                <p className="text-gray-500 mt-1">{section.description}</p>
              )}
            </div>
            <SectionChildren children={section.children || []} />
          </div>
        )}

        {/* Content Page */}
        {page && !error && (
          <ContentPage page={page} auth={auth} />
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Not Found</h3>
            <p className="text-gray-500 mb-6">The resource you are looking for does not exist or has been moved.</p>
            <Link href="/resources" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D1F35] text-white rounded-xl hover:bg-[#1a3a5c] font-medium text-sm">
              Back to Resources
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function SectionChildren({ children }: { children: NavChild[] }) {
  // Check if this section has "group" type children (like Outreach)
  const hasGroups = children.some(c => c.type === 'group');

  if (hasGroups) {
    return (
      <div className="space-y-8">
        {children.filter(c => c.type === 'group').map((group) => (
          <div key={group.slug}>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#0D1F35] rounded-full inline-block"></span>
              {group.title}
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {(group.children || []).map((item, i) => (
                <Link
                  key={item.fullSlug || item.slug}
                  href={`/resources/${item.fullSlug || item.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#0D1F35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-700 group-hover:text-gray-900 text-sm">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat list with optional dividers
  const segments: Array<{ dividerTitle?: string; items: NavChild[] }> = [];
  let currentSegment: NavChild[] = [];

  for (const child of children) {
    if (child.type === 'divider') {
      if (currentSegment.length > 0 || segments.length === 0) {
        segments.push({ items: currentSegment });
        currentSegment = [];
      }
      // Start new segment with divider label (strip the dashes)
      const label = child.title?.replace(/^---\s*/, '').replace(/\s*---$/, '').trim();
      segments.push({ dividerTitle: label, items: [] });
    } else {
      currentSegment.push(child);
    }
  }
  if (currentSegment.length > 0) {
    if (segments.length === 0) segments.push({ items: currentSegment });
    else segments[segments.length - 1].items = [...segments[segments.length - 1].items, ...currentSegment];
  }

  return (
    <div className="space-y-6">
      {segments.filter(s => s.items.length > 0 || s.dividerTitle).map((seg, si) => (
        <div key={si}>
          {seg.dividerTitle && (
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#0D1F35] rounded-full inline-block"></span>
              {seg.dividerTitle}
            </h2>
          )}
          {seg.items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {seg.items.map((item, i) => (
                <Link
                  key={item.fullSlug || item.slug}
                  href={`/resources/${item.fullSlug || item.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#0D1F35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-700 group-hover:text-gray-900 text-sm">{item.title}</span>
                  {item.type === 'section' && item.childCount ? (
                    <span className="ml-auto text-xs text-gray-400">{item.childCount} pages</span>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ContentPage({ page, auth }: { page: PageData; auth: AuthData }) {
  if (page.gating && !hasAccess(auth?.status, page.gating.requiredLevel)) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{page.title}</h3>
        <p className="text-gray-500 mb-4">{page.gating.reason || getLockedMessage(page.gating.requiredLevel)}</p>
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium">
          Requires: {page.gating.requiredLevel === 'active' ? 'Active Membership' : page.gating.requiredLevel === 'lifetime' ? 'Lifetime Membership' : 'Login'}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 px-6 sm:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{page.title}</h1>
      </div>

      <div className="px-6 sm:px-8 py-8">
        {page.isSection && page.children && page.children.length > 0 && (
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">In this section</h2>
            <div className="space-y-1">
              {page.children.map((child) => (
                <Link
                  key={child.fullSlug}
                  href={`/resources/${child.fullSlug}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 hover:border-[#0D1F35] hover:bg-gray-50 group"
                >
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#0D1F35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-700 group-hover:text-gray-900 text-sm font-medium">{child.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

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

      <div className="border-t border-gray-100 px-6 sm:px-8 py-4 bg-gray-50/50">
        <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0D1F35]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Resource Library
        </Link>
      </div>
    </div>
  );
}

function renderMarkdown(markdown: string, pageTitle?: string): string {
  let html = markdown;

  if (pageTitle) {
    const titleLower = pageTitle.toLowerCase();
    while (true) {
      const h1Match = html.match(/^\s*#\s+(.+?)(\n|$)/);
      if (h1Match && h1Match[1].trim().toLowerCase() === titleLower) {
        html = html.replace(/^\s*#\s+.+?\n?/, '');
      } else break;
    }
  }

  html = html.replace(/(\|[^\n]+\|\n)+/g, (match) => {
    const rows = match.trim().split('\n').filter(row => row.trim());
    if (rows.length < 2) return match;
    let tableHtml = '<div class="table-wrapper"><table>';
    rows.forEach((row, index) => {
      if (row.match(/^\|[\s\-:]+\|$/)) return;
      const cells = row.split('|').filter((cell, i, arr) => i > 0 && i < arr.length - 1);
      const tag = index === 0 ? 'th' : 'td';
      tableHtml += '<tr>';
      cells.forEach(cell => { tableHtml += `<${tag}>${cell.trim()}</${tag}>`; });
      tableHtml += '</tr>';
    });
    tableHtml += '</table></div>';
    return tableHtml;
  });

  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/- \[ \]/g, '<span class="checkbox unchecked">☐</span>');
  html = html.replace(/- \[x\]/gi, '<span class="checkbox checked">☑</span>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.slice(3, -3).trim();
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });
  html = html.replace(/^\s*[-*+]\s+(.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>');
  html = html.replace(/^>\s*(.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/^---$/gim, '<hr />');
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
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
