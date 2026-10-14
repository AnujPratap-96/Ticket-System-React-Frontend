<p align="center">
  <h1 align="center">DeskFlow - Support Portal & Staff Console (Frontend)</h1>
  <p align="center">A React 19 + Vite single-page app for the multi-tenant DeskFlow helpdesk: a customer portal, a staff console, a public help center, workspace sign-up and a platform console, with live updates, push notifications, dark mode and three languages.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" />
</p>

> The back end is [`../deskflow-api`](../deskflow-api). System-level diagrams (request flow, multi-tenancy, realtime, data model) are in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

---

## Table of Contents

- [Overview](#overview)
- [Feature Set](#feature-set)
  - [1. Workspaces (multi-tenancy in the browser)](#1-workspaces-multi-tenancy-in-the-browser)
  - [2. Authentication and Sessions](#2-authentication-and-sessions)
  - [3. Customer Portal](#3-customer-portal)
  - [4. Staff Console](#4-staff-console)
  - [5. Ticket Workbench](#5-ticket-workbench)
  - [6. Administration](#6-administration)
  - [7. Platform Console](#7-platform-console)
  - [8. Realtime, Push and Installable App](#8-realtime-push-and-installable-app)
  - [9. AI Assistant and AI Helpers](#9-ai-assistant-and-ai-helpers)
  - [10. Account, Security and Privacy](#10-account-security-and-privacy)
  - [11. Look and Feel](#11-look-and-feel)
- [Tech Stack](#tech-stack)
- [Routes & Access Matrix](#routes--access-matrix)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Design Decisions](#design-decisions)
- [Deployment](#deployment)
- [Known Limits](#known-limits)

---

## Overview

The app serves three kinds of people and chooses the experience from who signs in:

- **Guests:** the landing page, the help center, the AI assistant, sign-in, customer sign-up, "find your workspace" and "create a workspace".
- **Customers (`/portal`):** file and follow tickets, upload screenshots, rate support, see their plan and limits.
- **Staff (`/staff`):** agents, team leads and administrators. What they see is decided by their role, and the API enforces every rule; hiding a screen is only courtesy.
- **Platform owner (`/platform`):** manages workspaces (companies) and sees counts only.

Because DeskFlow is multi-tenant, every browser talks to **one workspace** (one company's support desk).

---

## Feature Set

### Who belongs where

There are three levels, and every account sits at exactly one of them.

```
PLATFORM            the DeskFlow installation itself (one platform owner, platform@deskflow.com)
│                   creates, suspends and deletes workspaces; sees counts only, never tickets
│
├── WORKSPACE "TechCorp Support"     one company that RUNS a helpdesk (a tenant)
│   ├── STAFF                        admin, leads, agents: they work for the workspace and have no organization
│   └── CUSTOMER COMPANIES           "organizations": the workspace's clients (Acme, Globex ...)
│        └── customers               people from those companies who file tickets
│
└── WORKSPACE "ShopEase Support"     a second company, completely separate (its own staff, clients, tickets)
```

Think of a shopping mall: the **platform** is the mall owner (rents out shops, never looks inside), a **workspace** is one shop, **staff** are the shop's employees (the admin is the manager), **organizations** are the shop's business customers, and a **ticket** is a customer's request. A workspace admin belongs to their workspace, not to the platform and not to any customer company, so their "organization" is empty. The platform owner is a separate account that belongs to no workspace.

### 1. Workspaces (multi-tenancy in the browser)

- The workspace is found from, in order: the address (`acme.yourdomain.com`, when `VITE_TENANT_BASE_DOMAIN` is set), a `?tenant=acme` link (emailed links carry it, and it is remembered), the last choice stored in the browser, then `VITE_DEFAULT_TENANT` (development). Axios sends it as the `X-Tenant` header.
- If the server cannot tell which workspace is meant, the app opens **`/workspace`** ("Find your workspace"); an unknown address clears the stored choice and asks again.
- **`/start`**: a company creates its own workspace (name, address with a live "available?" check, administrator, then the emailed code). 
- The sign-in page, the staff header and the portal show the workspace's name, with "Change workspace".
- With a single workspace on the server none of this appears.

### 2. Authentication and Sessions

| Route | Purpose |
|---|---|
| `/login` | Email and password, with the two-factor challenge when enabled |
| `/register` | Customer sign-up with an emailed 6-digit code |
| `/forgot-password` | Reset with an emailed code (signs out every device) |
| `/accept-invite` | Staff invitation: choose your own password |
| `/platform/login` | Platform owner sign-in |

The bearer token is kept in `localStorage`. A `401` signs the person out with a message (not during the first load). Realtime connections are closed on sign-out.

### 3. Customer Portal

- **Tickets** with status filters; **company admins** switch between "Whole company" and "Only mine".
- **New ticket**: department, urgency, subject, message, **department-specific extra questions**, drag/paste/browse attachments (progress bars, size and type checks), help-article suggestions while typing, and a warning when the person already has a similar open ticket.
- **Conversation** with formatted replies, attachments, close/reopen and a 1-5 star rating when resolved.
- **Support plan** page: response/resolution targets, performance over 90 days, and the company's plan limits with usage bars.
- Plan limits and rate limits surface as plain messages ("Your company's plan allows 100 tickets per month…").

### 4. Staff Console

- **Ticket queue** with search, status/priority/tag filters, "assigned to me", **saved views** (your own named filters), **bulk actions** (status, priority, assign to me) and live SLA countdown badges. Urgent and "customer sounds upset" flags appear on rows.
- **Analytics** (lead/admin): SLA compliance, trend chart, agent workload and a customer satisfaction panel (per day, per agent, low ratings to follow up).
- **Replies** (canned responses), a **Manage** menu for team, help articles and admin tools.

### 5. Ticket Workbench

- Conversation, internal notes (amber, staff only), SLA clocks, audit log, priority/status/assignment, tags, watch, merge.
- **Reply box:** a formatting toolbar (bold, italic, link, lists, quote, code), a **Write / Preview** tab (the preview is rendered by the API, so it is exactly what the customer gets), and an **"Add my signature"** switch that writes the signature into the box itself.
- **Canned replies** insert above the signature (`{{customer_name}}`, `{{agent_name}}`, `{{agent_title}}`, `{{signature}}`); **mentions**, **translate** (reply and customer messages), **AI draft** and **AI summary**.
- **Insights panel:** the AI's suggested priority/tags (apply or dismiss), duplicate suggestions with a merge shortcut, urgency/mood flags.
- **Live collision warning** when a teammate is typing on the same ticket.

### 6. Administration

Organizations (plan, limits and usage bars, company admins, move-tickets-on-delete), **Team** (invite by email, suspend/reactivate, delete, roles, capacity), **Departments** (hours, timezone, ticket-form builder), holidays, SLA policies, **Automation** rules, **Integrations** (Slack, Teams, signed webhooks), help-article editor with analytics, **Usage and limits**, AI settings and the global audit log.

### 7. Platform Console

`/platform` (platform owner only): workspaces with staff, customer and ticket **counts**, create a workspace (and invite its first administrator), suspend and restore. No ticket or customer is ever shown.

### 8. Realtime, Push and Installable App

- **Live updates:** Laravel Echo over Reverb on private channels (`user.{id}`, `ticket.{id}`, `ticket.{id}.staff`). Pings only trigger a re-fetch. If realtime is not configured or drops, screens simply poll (bell 30 s, customer ticket 20 s).
- **Browser push:** "Turn on notifications" on the account page (service worker `public/sw.js`, VAPID key from the API). Failures explain themselves (blocked, no push service, and so on).
- **Installable (PWA):** web manifest, icons and an offline page; the service worker caches only that page, never data.

### 9. AI Assistant and AI Helpers

A floating assistant on public, portal and staff pages (hidden on platform and workspace-picker pages). Guests get help-centre answers; customers also their own tickets; staff ticket overviews by role. Staff also get triage suggestions, drafts, summaries and translation inside the workbench. If AI is off the buttons report that politely.

### 10. Account, Security and Privacy

Name and photo (direct to Cloudinary), **job title for the signature**, change password, **active sessions** (sign out any device), TOTP two-factor with recovery codes, push notifications, "Download my data" and, for customers, erase my account.

### 11. Look and Feel

- **Light and dark mode** (a switch on every page, remembered per browser; light by default) and **English, Hindi and Spanish** for the main screens (navigation, sign-in, portal, help center). Other staff screens are English.
- Toasts for important actions, responsive layouts down to phone width, lazy-loaded staff/admin bundles so customers download less, accessible labels and roles.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Framework | React 19, Vite 8 |
| Routing | React Router 7 (`BrowserRouter`, lazy routes) |
| Styling | Tailwind CSS 3.4 (+ a small dark-mode override layer in `index.css`) |
| HTTP | Axios with token and workspace interceptors |
| Realtime | Laravel Echo + Pusher protocol (Reverb) |
| Icons / QR | lucide-react, qrcode (two-factor setup) |
| Quality | oxlint, Playwright end-to-end tests |

---

## Routes & Access Matrix

| Path | Who | Screen |
|---|---|---|
| `/` | everyone | Landing page with help-center search |
| `/help`, `/help/:slug` | everyone | Help center and articles |
| `/workspace`, `/start` | everyone | Find a workspace / create one |
| `/login`, `/register`, `/forgot-password`, `/accept-invite` | signed out | Authentication |
| `/platform/login` | signed out | Platform owner sign-in |
| `/platform` | platform owner | Workspaces overview |
| `/portal`, `/portal/new`, `/portal/tickets/:id`, `/portal/sla`, `/portal/account` | customers | Customer portal |
| `/staff`, `/staff/tickets/:id`, `/staff/canned`, `/staff/account` | staff | Queue, workbench, replies, profile |
| `/staff/analytics`, `/staff/team`, `/staff/kb` | lead, admin | Reporting, team, help articles |
| `/staff/organizations`, `/staff/departments`, `/staff/holidays`, `/staff/policies`, `/staff/automation`, `/staff/integrations`, `/staff/usage`, `/staff/ai`, `/staff/audit`, `/staff/workspace`, `/staff/activity` | admin | Configuration (workspace settings: branding, email channel, security, export; admin activity) |

Each side is redirected away from the other. **The API enforces every permission**; these guards are user experience.

---

## Project Structure

```
deskflow-frontend/
├── e2e/                        # Playwright tests (auth, tickets, admin, workspaces)
├── public/                     # sw.js, manifest.webmanifest, offline.html, icons, brand assets
├── src/
│   ├── api/client.js           # Axios: base URL, token, X-Tenant header, 401 and workspace handling
│   ├── context/                # AuthContext, ToastContext, PreferencesContext (theme + language)
│   ├── hooks/                  # useTicketPresence (15 s heartbeat), useSlaTimer
│   ├── i18n/                   # en, hi, es dictionaries
│   ├── lib/                    # tenant, realtime, push, signature, upload, download, shared helpers
│   ├── components/
│   │   ├── assistant/          # Floating AI assistant
│   │   ├── common/             # Modal, Dropdown, RichEditor, UsageBar, PreferenceControls, attachments ...
│   │   ├── navigation/         # Topbar, NotificationBell
│   │   ├── sla/                # SlaBadge
│   │   └── ticket/             # InsightsPanel, MergeModal, TagEditor, CustomFields, FormBuilder, TranslateTool ...
│   ├── pages/
│   │   ├── landing/ help/ auth/ workspace/ platform/
│   │   ├── portal/ staff/ tickets/ account/
│   │   └── admin/              # Analytics, team, organizations, automation, integrations, usage ...
│   ├── App.jsx                 # Routes, guards and lazy chunks
│   └── main.jsx                # Bootstrap and service-worker registration
├── Dockerfile, nginx.conf      # Static build served by nginx (alternative to Vercel)
├── vercel.json                 # SPA rewrite
└── playwright.config.js
```

---

## Getting Started

```bash
cd deskflow-frontend
npm ci
cp .env.example .env     # set VITE_API_URL (and VITE_DEFAULT_TENANT=techcorp for the demo data)
npm run dev              # http://localhost:5173
```

Needs Node 20+ and a running API ([`../deskflow-api`](../deskflow-api)) seeded with `php artisan db:seed`. Demo logins are listed in the API README (password = the API's `DEMO_PASSWORD`, workspace `techcorp`).

---

## Environment Variables

Vite bakes these in **at build time**; rebuild after changing them.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000/api/v1` | API base URL |
| `VITE_DEFAULT_TENANT` | unset | Workspace to use when none was chosen (local development) |
| `VITE_TURNSTILE_SITE_KEY` | unset | Shows the Cloudflare human check on sign-up and forgot-password (pair with `TURNSTILE_SECRET` on the API) |
| `VITE_TENANT_BASE_DOMAIN` | unset | Wildcard domain: `acme.<domain>` selects the workspace `acme` |
| `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME` | unset | Optional live updates (match the API's Reverb settings). Without them the app polls |
| `VITE_ENABLE_DEMO_SWITCHER` | unset | `true` (dev server only) adds a "switch demo account" list. Never set in production |

---

## Scripts

| Script | |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |
| `npm run test:e2e` | Playwright browser tests |

---

## Testing

The browser tests drive a real API with the demo data (workspaces `techcorp` and `shopease`). Start the API, then:

```bash
CHROMIUM_PATH=/usr/bin/chromium E2E_NO_SERVER=1 npm run test:e2e     # use an existing browser and dev server
npx playwright install chromium && npm run test:e2e                   # or let Playwright download one
```

They cover sign-in and role routing, filing a ticket and the full reply loop, internal notes staying hidden from customers, admin tools, dark mode and language persistence, and workspace isolation (the same email in two workspaces sees different tickets; staff of one company cannot sign in to another; the platform owner sees counts only). `.github/workflows/ci.yml` runs lint, build, the API tests and these.

---

## Design Decisions

1. **The API is the authority.** Route guards and hidden menus are courtesy; every rule is enforced server-side.
2. **The workspace travels with the request**, never in the data: a header before sign-in, the person's own token after.
3. **Realtime is a bonus, not a dependency.** Pings carry no content; every screen also polls.
4. **Safe rich text.** Replies are Markdown; the server renders and sanitises (no raw HTML, no images), and the editor's preview calls the same renderer.
5. **Small first load.** Staff and admin pages are lazy chunks; the service worker caches only an offline page, never API data.
6. **Dark mode without rewriting every component:** a class on `<html>` plus a compact override layer for the palette in use.

---

## Deployment

- **Vercel:** set `VITE_API_URL` (and the optional Reverb and tenancy variables) in the project settings; `vercel.json` rewrites every path to `index.html`.
- **Docker:** `Dockerfile` builds the app with `VITE_API_URL` as a build argument and serves it with nginx (`nginx.conf`).
- For workspace subdomains, point a wildcard DNS record at the app and set `VITE_TENANT_BASE_DOMAIN` here and `TENANCY_BASE_DOMAIN` in the API.
- Push notifications need HTTPS.

---

## Known Limits

- Dark mode and translations cover the main screens; the rest of the staff console is English.
- Real-time updates and browser push require the optional Reverb service and VAPID keys on the API.
- The browser tests depend on the seeded demo data and a running API; they do not start one.
