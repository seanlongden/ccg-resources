# CCG Resources

A members-only resource library for Closing Clients Group (CCG). Members log in with their email, verified against Stripe subscriptions and a Google Sheets lifetime-member list.

## Tech Stack
- Next.js 13 (App Router) on port 5000
- Tailwind CSS + @tailwindcss/typography
- TypeScript
- iron-session (encrypted cookie sessions)
- Stripe (subscription verification)
- Google Sheets (lifetime member list)

## Architecture

### Auth Flow
- Login page (`/`) collects email, POSTs to `/api/auth`
- Server checks Stripe subscriptions + Google Sheets lifetime list
- Session stored in encrypted iron-session cookie (1 week)
- Session revalidated every 23 hours on page visit

### Content System
- Content is pre-exported to JSON in `content/`
  - `navigation.json` — 6-section top-level nav structure
  - `page-index.json` — flat index of all pages for search
  - `pages-0.json` to `pages-21.json` — chunked page content (markdown)
- `src/lib/content.ts` loads and caches all content

### Navigation Structure (6 sections)
1. **Key Resources** — FAQs, recommended settings, tool discounts, webinar vault, mindset
2. **Get Started** — Agency setup: niche, ICP, pricing, service model, website, VSL, contracts
3. **Outreach** — 3 grouped sub-sections: Cold Email, LinkedIn, Cold Calling
4. **Sales** — Sales calls, positioning, case studies, offers, guarantees
5. **Fulfillment** — Onboarding, client communications, retention
6. **Scale** — Scaling roadmap, hiring, automations

### Pages
- `/` — Login page
- `/resources` — 6-card grid overview
- `/resources/[section-slug]` — Section overview (list/grouped list of pages)
- `/resources/[...slug]` — Individual content pages (rendered markdown)

### API Routes
- `GET /api/auth` — Check session
- `POST /api/auth` — Login (verify email against Stripe/Sheets)
- `DELETE /api/auth` — Logout
- `GET /api/content/navigation` — Nav structure
- `GET /api/content/page?slug=xxx` — Page content
- `GET /api/content/page?search=xxx` — Search

## Environment Variables / Secrets
- `STRIPE_SECRET_KEY` — Stripe secret key for subscription lookup
- `GOOGLE_SHEET_ID` — Google Sheet ID for lifetime member list
- `SESSION_SECRET` — Min 32-char string for iron-session encryption

## Running
- `npm run dev` — Dev server on port 5000 (0.0.0.0)
- `npm run build` — Production build
- `npm run start` — Production server on port 5000 (0.0.0.0)
