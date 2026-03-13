import { Marked } from 'marked';

interface NavLink {
  label: string;
  href: string;
}

interface ProcessedContent {
  html: string;
  prevLink?: NavLink;
  nextLink?: NavLink;
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function preprocess(markdown: string, pageTitle?: string): { cleaned: string; prevLink?: NavLink; nextLink?: NavLink } {
  let text = markdown;

  if (pageTitle) {
    const titleLower = pageTitle.toLowerCase().trim();
    text = text.replace(/^\s*#\s+(.+?)(\n|$)/gm, (match, captured) => {
      if (captured.trim().toLowerCase() === titleLower) return '';
      return match;
    });
  }

  text = text.replace(/^-\s+Control panel\s*⚡️[\s\S]*?\n(?=\n#|\n---)/m, '');

  text = text.replace(/\n*On this page\s*$/i, '');

  let prevLink: NavLink | undefined;
  let nextLink: NavLink | undefined;

  const prevMatch = text.match(/←\s*Previous\s*\n+\[([^\]]+)\]\(([^)]+)\)/i);
  if (prevMatch) {
    prevLink = { label: prevMatch[1], href: prevMatch[2] };
  }
  const nextMatch = text.match(/Next\s*→\s*\n+\[([^\]]+)\]\(([^)]+)\)/i);
  if (nextMatch) {
    nextLink = { label: nextMatch[1], href: nextMatch[2] };
  }

  text = text.replace(/\n←\s*Previous[\s\S]*$/, '');

  text = text.replace(/!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g, '');

  text = text.replace(/\[?(https:\/\/www\.loom\.com\/share\/([a-zA-Z0-9]+)[^\s\])<]*)\]?\(?[^)]*\)?/g, (_match, _url, videoId) => {
    return `\n\n%%LOOM_EMBED:${videoId}%%\n\n`;
  });

  text = text.replace(/<div\s+class="callout">([\s\S]*?)<\/div>/g, (_match, inner) => {
    return `%%CALLOUT_START%%${inner}%%CALLOUT_END%%`;
  });
  text = text.replace(/<div\s+class=\\"callout\\">([\s\S]*?)<\/div>/g, (_match, inner) => {
    return `%%CALLOUT_START%%${inner.replace(/\\n/g, '\n')}%%CALLOUT_END%%`;
  });

  text = text.replace(/^- \*\*([^*]+)\*\*\s*\n(?:\s*\n)*/gm, (_, title) => {
    return `**${title}**\n\n`;
  });

  text = text.replace(/^( {4}|\t)(?!%%)/gm, '');

  text = text.replace(/\n{3,}/g, '\n\n');

  return { cleaned: text.trim(), prevLink, nextLink };
}

const markedInstance = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    heading({ text, depth }: { text: string; depth: number }) {
      const stepMatch = text.match(/^Step\s+(\d+):\s*(.*)/i);
      if (stepMatch && depth === 2) {
        return `
          <div class="ccg-step">
            <div class="ccg-step-badge">${escapeAttr(stepMatch[1])}</div>
            <h2 class="ccg-step-title">${stepMatch[2]}</h2>
          </div>`;
      }
      return `<h${depth}>${text}</h${depth}>`;
    },

    link({ href, title, text }: { href: string; title?: string | null; text: string }) {
      const safeHref = escapeAttr(href);
      const isExternal = href.startsWith('http') && !href.includes('/resources/');

      if (href.startsWith('/resources/')) {
        return `<a href="${safeHref}" class="ccg-internal-link"${title ? ` title="${escapeAttr(title)}"` : ''}>${text}</a>`;
      }

      const externalIcon = isExternal
        ? '<svg class="ccg-external-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.75a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V6.31l-5.47 5.47a.75.75 0 01-1.06-1.06l5.47-5.47H12.25a.75.75 0 01-.75-.75z" clip-rule="evenodd" /></svg>'
        : '';
      const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${safeHref}"${attrs}${title ? ` title="${escapeAttr(title)}"` : ''} class="ccg-link">${text}${externalIcon}</a>`;
    },

    listitem({ text, checked }: { text: string; checked?: boolean }) {
      if (checked === true) {
        return `<li class="ccg-checklist-item ccg-checked"><span class="ccg-checkbox ccg-checkbox-checked"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/><rect x="3" y="3" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span><span>${text}</span></li>`;
      }
      if (checked === false) {
        return `<li class="ccg-checklist-item"><span class="ccg-checkbox ccg-checkbox-unchecked"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="14" height="14" rx="3"/></svg></span><span>${text}</span></li>`;
      }
      return `<li>${text}</li>`;
    },

    blockquote({ text }: { text: string }) {
      return `<blockquote class="ccg-blockquote">${text}</blockquote>`;
    },

    hr() {
      return '<hr class="ccg-divider" />';
    },

    image({ href, title, text }: { href: string; title: string | null; text: string }) {
      if (!href || !href.startsWith('http')) return '';
      return `<figure class="ccg-figure"><img src="${escapeAttr(href)}" alt="${escapeAttr(text || '')}" loading="lazy" />${title ? `<figcaption>${escapeAttr(title)}</figcaption>` : ''}</figure>`;
    },
  },
});

function postprocess(html: string): string {
  html = html.replace(/(<p>)?\s*%%LOOM_EMBED:([a-zA-Z0-9]+)%%\s*(<\/p>)?/g, (_match, _p1, videoId: string) => {
    return `
      <div class="ccg-video-embed">
        <div class="ccg-video-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Video Tutorial
        </div>
        <div class="ccg-video-wrapper">
          <iframe
            src="https://www.loom.com/embed/${escapeAttr(videoId)}"
            frameborder="0"
            allowfullscreen
            allow="autoplay; fullscreen"
          ></iframe>
        </div>
      </div>`;
  });

  html = html.replace(/%%CALLOUT_START%%([\s\S]*?)%%CALLOUT_END%%/g, (_match, content) => {
    let cleaned = content.trim();
    cleaned = cleaned.replace(/\\n/g, '\n');

    let type = 'info';
    let icon = 'ℹ️';
    if (cleaned.startsWith('💡')) { type = 'tip'; icon = '💡'; cleaned = cleaned.slice(2).trim(); }
    else if (cleaned.startsWith('ℹ️')) { type = 'info'; icon = 'ℹ️'; cleaned = cleaned.slice(2).trim(); }
    else if (cleaned.startsWith('⚠️')) { type = 'warning'; icon = '⚠️'; cleaned = cleaned.slice(2).trim(); }
    else if (cleaned.startsWith('🔥')) { type = 'fire'; icon = '🔥'; cleaned = cleaned.slice(2).trim(); }

    const innerHtml = markedInstance.parse(cleaned, { async: false }) as string;

    return `
      <div class="ccg-callout ccg-callout-${type}">
        <div class="ccg-callout-icon">${icon}</div>
        <div class="ccg-callout-content">${innerHtml}</div>
      </div>`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  html = html.replace(/<p>\s*<\/p>/g, '');

  html = html.replace(/<p>\s*(<div class="ccg-)/g, '$1');
  html = html.replace(/(<\/div>)\s*<\/p>/g, '$1');

  return html;
}

export function renderContent(markdown: string, pageTitle?: string): ProcessedContent {
  const { cleaned, prevLink, nextLink } = preprocess(markdown, pageTitle);

  let html = markedInstance.parse(cleaned, { async: false }) as string;
  html = postprocess(html);

  return { html, prevLink, nextLink };
}
