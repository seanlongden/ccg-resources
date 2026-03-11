# CCG Resources - Design Brief

## What This Is
A members-only resource library for Closing Clients Group (CCG) - a community teaching people to build lead generation agencies. Members log in with their email, verified against Stripe subscriptions.

---

## The Problem

**The current visual design/styling is fine** - keep the colors, header, general look.

**But the content STRUCTURE is completely wrong.**

Right now there are 15+ sections and it's confusing and overwhelming. Users don't know where to start or how to navigate. The "$30K Month Roadmap" duplicates content that exists elsewhere.

---

## The Solution

We've reorganized everything into **6 logical sections** based on the user journey:

1. **Key Resources** → Quick access essentials
2. **Get Started** → Foundation before outreach
3. **Outreach** → Getting clients (cold email, LinkedIn, cold calling)
4. **Sales** → Closing deals
5. **Fulfillment** → Delivering for clients
6. **Scale** → Growing the business

The navigation should be simple: **6 cards on the main page**, each leading to its contents.

---

## New Content Hierarchy

### 1. Key Resources (pinned/quick access)
These are the most frequently needed items - should be prominent:
- Recommended Settings
- What's Working NOW (Deliverability Updates)
- FAQs
- Tool Discounts (Exclusive Offers)
- Webinar Vault

### 2. Get Started
Foundation before doing any outreach:
- Choose Your Niche
- Ideal Client Profile
- Price Your Service
- Choose Your Service Model
- Create Your Website
- Creating Your VSL
- Offers & Guarantees
- Finance & Legal
- Agreements & Contracts

### 3. Outreach
This is the largest section - has 3 subsections:

**Cold Email** (the core - most content lives here)
- Cold Email Setup
- Deliverability
- → Recommended Settings *(link to Key Resources)*
- → What's Working NOW *(link to Key Resources)*
- Email Templates
- List Building
- Writing Emails
- Segmentation & Personalisation
- Campaign Setup
- Running & Improving Campaigns
- Inbox Management
- CRM Management
- Lead Nurturing

**LinkedIn**
- Profile Setup
- Boolean Searches
- Voice Messages
- Additional Resources

**Cold Calling**
- Should I Add Cold Calling?
- Conquer Cold Calling Course
- Tech Stack
- Scripts & Templates
- Training Videos

### 4. Sales
- Sales Calls
- Positioning
- Chain of Beliefs Framework
- Qualifying Prospects & Sales Process
- Sales Assets & Lead Magnets
- Case Studies
- Collecting Testimonials

### 5. Fulfillment
- Onboarding Workflow
- Onboarding Calls
- Onboarding Automations
- Post-Call Actions
- Client Communications
- Fulfillment Best Practices
- Increasing Client Retention

### 6. Scale
- Basic Breakdown of Scaling
- Scaling Roadmap & Timeline
- Vertical vs Horizontal Scaling
- Strategy and Planning
- Cash Management
- Audit the Offer
- SOPs
- Hiring (multiple pages)
- Automations (multiple pages)

---

## What's Being Removed

- **$30K Month Roadmap** - Redundant. The new structure IS the roadmap (Get Started → Outreach → Sales → Fulfillment → Scale)
- **Mindset & Accountability** - Can be folded into Key Resources or removed

---

## Design Requirements

### Keep These (already working)
- Primary color: #0D1F35 (dark navy)
- Logo: Green-to-blue gradient "C" (/public/icon.png)
- Clean, professional styling
- Header with search and logout

### Change These

**Main Page:**
- Show 6 cards in a grid (2x3 or 3x2)
- Each card: Title, brief description, item count
- Clicking a card shows that section's contents

**Section Page:**
- Back button
- Section title
- Simple list of pages (not more cards)
- If section has subsections (Outreach has Cold Email/LinkedIn/Cold Calling), show grouped lists

**Content Page:**
- Back button
- Page title
- Rendered markdown content
- Tables must render properly (not raw markdown pipes)

---

## Technical Context

### Existing API Endpoints (don't change)
- `GET /api/auth` - Check authentication
- `DELETE /api/auth` - Logout
- `GET /api/content/navigation` - Get sections and pages
- `GET /api/content/page?slug=xxx` - Get page content
- `GET /api/content/page?search=xxx` - Search

### Tech Stack
- Next.js 13 (App Router)
- Tailwind CSS
- TypeScript

### What NOT to Change
- Authentication flow
- API routes
- Content loading from JSON files
- Just restructure the navigation UI

---

## Summary

**Current state:** 15+ sections, confusing, no clear path
**Goal:** 6 sections, clear user journey, simple card-based navigation

The visual styling is fine. The structure needs to change to match the hierarchy above.
