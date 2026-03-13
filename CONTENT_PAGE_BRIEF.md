# Content Page Design Brief

## The Problem

The navigation and structure are good now. But the **actual content pages** (where users read the resources) look awful. The markdown is being rendered but with poor typography, spacing, and readability.

---

## The Solution

Use proper typography rules for rendering markdown content. The easiest way is to use **Tailwind Typography plugin** (`@tailwindcss/typography`).

---

## Install Tailwind Typography

```bash
npm install @tailwindcss/typography
```

Add to `tailwind.config.ts`:
```js
plugins: [
  require('@tailwindcss/typography'),
]
```

---

## Apply to Content Container

Wrap the rendered markdown content with the `prose` class:

```jsx
<div className="prose prose-lg max-w-none">
  {/* rendered markdown here */}
</div>
```

---

## Recommended Prose Configuration

```jsx
<div className="
  prose
  prose-lg
  max-w-3xl
  mx-auto

  prose-headings:font-semibold
  prose-headings:text-gray-900

  prose-h2:text-2xl
  prose-h2:mt-10
  prose-h2:mb-4

  prose-h3:text-xl
  prose-h3:mt-8
  prose-h3:mb-3

  prose-p:text-gray-600
  prose-p:leading-relaxed

  prose-a:text-blue-600
  prose-a:underline
  prose-a:font-medium
  hover:prose-a:text-blue-800

  prose-ul:text-gray-600
  prose-ol:text-gray-600
  prose-li:my-1

  prose-strong:text-gray-900

  prose-blockquote:border-l-4
  prose-blockquote:border-blue-500
  prose-blockquote:bg-blue-50
  prose-blockquote:py-2
  prose-blockquote:px-4
  prose-blockquote:not-italic
  prose-blockquote:text-gray-700

  prose-code:bg-gray-100
  prose-code:px-1.5
  prose-code:py-0.5
  prose-code:rounded
  prose-code:text-sm
  prose-code:font-mono
  prose-code:before:content-none
  prose-code:after:content-none

  prose-pre:bg-gray-900
  prose-pre:text-gray-100
  prose-pre:rounded-lg

  prose-table:w-full
  prose-th:bg-[#0D1F35]
  prose-th:text-white
  prose-th:font-semibold
  prose-th:px-4
  prose-th:py-3
  prose-th:text-left
  prose-td:px-4
  prose-td:py-3
  prose-td:border-b
  prose-td:border-gray-100

  prose-img:rounded-lg
  prose-img:shadow-md

  prose-hr:border-gray-200
">
  {/* rendered content */}
</div>
```

---

## Typography Rules Being Applied

| Element | Rule |
|---------|------|
| Body text | 18px, line-height 1.75, gray-600 |
| Max width | 65ch (~3xl) for optimal reading |
| Headings | Semibold, gray-900, proper spacing above/below |
| H2 | 2xl, 2.5rem top margin, 1rem bottom |
| H3 | xl, 2rem top margin, 0.75rem bottom |
| Paragraphs | Relaxed line height, proper spacing |
| Links | Blue, underlined, darker on hover |
| Lists | Consistent spacing, 0.25rem between items |
| Blockquotes | Blue left border, light blue background |
| Code (inline) | Gray background, monospace, rounded |
| Code blocks | Dark background, light text, rounded |
| Tables | Header with brand color, alternating rows, padding |
| Images | Rounded corners, subtle shadow |

---

## Content Page Layout

The overall page structure should be:

```
┌─────────────────────────────────────────────┐
│  Header (logo, breadcrumb, logout)          │
├─────────────────────────────────────────────┤
│                                             │
│  ← Back to Resources                        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Page Title (H1)                     │   │
│  │                                      │   │
│  │  Content with proper typography...   │   │
│  │                                      │   │
│  │  - Nice headings                     │   │
│  │  - Readable paragraphs               │   │
│  │  - Styled lists                      │   │
│  │  - Good tables                       │   │
│  │  - Callouts/tips                     │   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ← Back to Resources                        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Specific Fixes Needed

### 1. Don't repeat the title
The page title is shown in the header. Don't show it again as an H1 in the content. Strip the first H1 from markdown if it matches the page title.

### 2. Max width for readability
Content should be max 65-75 characters wide. Don't let it span the full width of the screen.

### 3. Proper spacing
- More space above headings than below
- Consistent paragraph spacing
- Breathing room around lists

### 4. Tables must render properly
Currently tables show as raw markdown (pipes and dashes). They need to be parsed and rendered as actual HTML tables with:
- Header row with dark background
- Alternating row colors
- Proper cell padding
- Horizontal scroll on mobile if needed

### 5. Callouts/Tips
If content has tip boxes or callouts, style them with:
- Colored left border or background
- Icon (optional)
- Different from regular text

---

## Reference Sites

Look at how these sites style their content pages:
- Stripe Docs (https://stripe.com/docs)
- Notion Help (https://notion.so/help)
- Linear Docs (https://linear.app/docs)
- Tailwind Docs (https://tailwindcss.com/docs)

All have:
- Clean typography
- Constrained width
- Proper heading hierarchy
- Good spacing
- Nice code blocks
- Readable tables

---

## Summary

**Don't reinvent the wheel.** Use Tailwind Typography plugin with the `prose` classes. It handles 90% of markdown styling automatically. Just customize the colors to match the brand.
