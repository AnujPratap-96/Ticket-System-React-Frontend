# DeskFlow Frontend

React 19 single-page app for **DeskFlow Enterprise**: a public landing page and help center, a customer portal, and a staff console, all talking to the [DeskFlow API](../deskflow-api).

## Contents
- [Features](#features)
- [Tech stack](#tech-stack)
- [Routes](#routes)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Deploying to Vercel](#deploying-to-vercel)
- [Docker](#docker)

## Features

**Public:** landing page with help search, help center and articles, sign-in, signup with email code, password reset, AI assistant bubble (help questions only for visitors).

**Everyone signed in:** edit your display name and profile photo (My account), photos show next to messages; show/hide button on every password field; the assistant bubble on every page (guests: help questions only; customers: also their own tickets; staff: console help and their assigned tickets).

**Feedback:** every important action shows a toast (reply sent, note saved, ticket closed/reopened, name or photo updated, signed in/out, exports, deletes). Toasts appear top-right under the header, can be dismissed, and pause while hovered.

**Customers (`/portal`):** create tickets with screenshots and files, follow and reply to conversations, close or reopen, rate resolved tickets, see notifications, ask the assistant about their tickets, download or erase their data, optional two-factor authentication.

**Staff (`/staff`, role-aware menus):**
- *Agents:* ticket queue with filters, conversation, internal notes, canned replies, tags, watch, @mentions, live "someone else is typing" warning, AI draft reply and summary.
- *Leads:* plus analytics, team routing controls, help-article editor, merge duplicate tickets, audit log per ticket.
- *Admins:* plus staff management, departments, holidays, SLA policies, global audit log, AI on/off switch.

## Tech stack

React 19 · Vite · React Router 7 · Tailwind CSS 3 · Axios · lucide-react icons · qrcode (2FA setup) · oxlint.

## Routes

| Path | Who | Screen |
|---|---|---|
| `/` | everyone | landing page |
| `/login`, `/register`, `/forgot-password`, `/accept-invite` | signed out | authentication (the last one is the link in a staff invitation email) |
| `/help`, `/help/:slug` | everyone | help center |
| `/portal`, `/portal/new`, `/portal/tickets/:id`, `/portal/sla`, `/portal/account` | customers | customer portal (incl. support plan) |
| `/staff` | staff | ticket queue |
| `/staff/tickets/:id` | staff | ticket detail |
| `/staff/analytics`, `/staff/team`, `/staff/kb` | lead, admin | reporting and team |
| `/staff/departments` (with ticket forms), `/staff/holidays`, `/staff/policies`, `/staff/organizations`, `/staff/automation`, `/staff/integrations`, `/staff/audit`, `/staff/ai` | admin | configuration |
| `/staff/canned`, `/staff/account` | staff | replies and profile |

Signing in sends customers to `/portal` and staff to `/staff`; each side is redirected away from the other. Hiding a screen is only user-experience: **the API enforces every permission**.

## Getting started

```bash
cd deskflow-frontend
npm ci
cp .env.example .env          # set VITE_API_URL
npm run dev                   # http://localhost:5173
```
Requires Node 20+ and a running API (see [`../deskflow-api/README.md`](../deskflow-api/README.md)).

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000/api/v1` | API base URL. **Baked in at build time**: rebuild after changing it |
| `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME` | unset | optional live updates over WebSockets (match the API's Reverb settings). Without them the app polls |
| `VITE_ENABLE_DEMO_SWITCHER` | unset | `true` (dev server only) adds a "switch demo account" list to the user menu. Never set in production |

## Scripts

| Script | |
|---|---|
| `npm run dev` | development server with hot reload |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the production build locally |
| `npm run lint` | oxlint |
| `npm run test:e2e` | Playwright browser tests in `e2e/` (API must be running with the demo data; `CHROMIUM_PATH=/usr/bin/chromium E2E_NO_SERVER=1 npm run test:e2e` to use an existing browser and dev server) |

## Project structure

```
src/
  api/client.js            axios instance: base URL, bearer token, 401 handling
  context/                 AuthContext (session, 2FA, permissions), ToastContext
  hooks/                   useTicketPresence (15 s heartbeat), useSlaTimer
  lib/                     status/priority helpers, direct-to-Cloudinary upload, file download
  components/
    common/                Modal, Dropdown, Avatar, BrandMark, PasswordInput, badges, attachments, charts
    navigation/            Topbar (staff), NotificationBell
    ticket/                composer helpers: canned replies, tags, mentions, merge, rating
    sla/                   SlaBadge (live countdown)
    assistant/             AssistantWidget (floating chat bubble, mounted once in App.jsx for every page)
  pages/
    landing/ auth/ help/ portal/ staff/ tickets/ admin/ account/
  App.jsx                  routes, guards, lazy-loaded staff code
```

## How it works

- **Auth:** the token is kept in `localStorage`; on load the app calls `/auth/me` to restore the session. A `401` anywhere signs the user out.
- **Code splitting:** the staff console is lazy-loaded, so customers never download it.
- **Attachments:** the browser asks the API to sign an upload, then sends the file **directly to Cloudinary** with progress. The API verifies size and type before attaching.
- **Real-time-ish:** the bell polls every 30 s, the customer ticket page every 20 s, staff send a presence heartbeat every 15 s. (No websockets.)
- **Safe rendering:** assistant and article text is rendered as plain text, never as HTML.

## Deploying to Vercel

1. Import the repository, set **Root Directory** to `deskflow-frontend`.
2. Framework preset **Vite**, build command `npm run build`, output `dist`.
3. Environment variable `VITE_API_URL=https://<your-api>/api/v1`.
4. `vercel.json` rewrites all paths to `index.html`, so deep links work after a refresh.
5. Add the Vercel URL to the API's `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS`, then restart the API.

See [`../docs/DEPLOYMENT_GUIDE.md`](../docs/DEPLOYMENT_GUIDE.md).

## Docker

A `Dockerfile` (build with Node, serve with nginx, SPA fallback) is provided for local parity or non-Vercel hosting:

```bash
docker build --build-arg VITE_API_URL=http://localhost:8000/api/v1 -t deskflow-frontend .
docker run -p 5173:80 deskflow-frontend
```
