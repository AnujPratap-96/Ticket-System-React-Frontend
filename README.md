<p align="center">
  <h1 align="center">DeskFlow - Customer Support & Staff Console Frontend</h1>
  <p align="center">A high-performance React 19 + Vite single-page application delivering an enterprise customer support portal, real-time staff ticketing console, public knowledge base, and administrative suites.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
  <img src="https://img.shields.io/badge/Lucide_Icons-F107A3?style=for-the-badge" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Feature Set](#feature-set)
  - [1. Authentication & Session Security](#1-authentication--session-security)
  - [2. Application Shell & Responsive Layout](#2-application-shell--responsive-layout)
  - [3. Public Help Center & Articles](#3-public-help-center--articles)
  - [4. Customer Support Portal](#4-customer-support-portal)
  - [5. Staff Ticketing Console & Queue Management](#5-staff-ticketing-console--queue-management)
  - [6. Ticket Conversation & Collaboration](#6-ticket-conversation--collaboration)
  - [7. Real-Time Streaming & Presence Detection](#7-real-time-streaming--presence-detection)
  - [8. Floating AI Assistant Widget](#8-floating-ai-assistant-widget)
  - [9. Direct-to-Cloudinary File Attachments](#9-direct-to-cloudinary-file-attachments)
  - [10. Team Lead & Administrative Suites](#10-team-lead--administrative-suites)
  - [11. User Profile & Two-Factor Authentication](#11-user-profile--two-factor-authentication)
  - [12. Visual Feedback & Toast System](#12-visual-feedback--toast-system)
- [Tech Stack](#tech-stack)
- [Routes & Access Matrix](#routes--access-matrix)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Architecture & Key Design Decisions](#architecture--key-design-decisions)
- [Deployment (Vercel & Docker)](#deployment-vercel--docker)

---

## Overview

**DeskFlow Frontend** is the official single-page web client for the DeskFlow Enterprise support platform. Built with React 19, Vite, Tailwind CSS, and React Router 7, it connects to the [DeskFlow API](../deskflow-api) to deliver high-speed customer self-service and high-efficiency staff workflows.

The application automatically segments experiences based on user credentials:
- **Unauthenticated Guests:** Explore landing resources, search knowledge base articles, and chat with the AI assistant.
- **Customers (`/portal`):** Submit support requests, track conversations, upload screenshots, monitor SLA targets, and manage company tickets.
- **Support Staff (`/staff`):** Access a high-throughput ticketing console with saved views, canned replies, live collision warnings, AI triage suggestions, and administrative controls.

---

## Feature Set

### 1. Authentication & Session Security

Comprehensive multi-screen identity flows:

| Route | View | Description |
|---|---|---|
| `/login` | Sign In | Email and password authentication with optional TOTP 2FA challenge handling |
| `/register` | Registration | Customer signup with 6-digit email OTP verification |
| `/forgot-password` | Password Recovery | Multi-step OTP recovery flow resetting passwords across all active sessions |
| `/accept-invite` | Staff Invitation | Token-authenticated onboarding allowing invited staff to set their credentials |

- **Bearer Token Management:** Authenticated tokens are stored securely in `localStorage` with sanitized base URL normalization to prevent double-slash (`//`) API anomalies.
- **Session Expiry Guard:** Intelligent 401 handling invalidates expired sessions without firing false alerts on initial cold boots.
- **Role Routing:** Customers are automatically routed to `/portal`, while staff members (`agent`, `lead`, `admin`) are directed to `/staff`.

---

### 2. Application Shell & Responsive Layout

Fluid, accessible user interfaces designed for speed and mobile responsiveness:

- **Adaptive Navigation:** Mobile-optimized drawer menus, breadcrumb trails, and quick-action toolbars.
- **Notification Bell:** Live polling (30s) and WebSocket notifications for ticket updates, SLA warnings, and @mentions.
- **Code Splitting:** The heavy staff console and administrative suites are lazy-loaded on demand, ensuring customer-facing pages load near-instantaneously.
- **Theme & Typography:** Tailored design system with custom CSS variables, status badges, and accessible focus states.

---

### 3. Public Help Center & Articles

Searchable knowledge repository for customer self-service:

- **Article Browser:** Clean category navigation and markdown article rendering.
- **Instant Search:** Debounced full-text search with fallback to AI semantic matching when keyword queries return zero hits.
- **Feedback Collection:** Interactive "Was this helpful?" voting on published articles to measure effectiveness.

---

### 4. Customer Support Portal

Dedicated workspace for end users and corporate clients (`/portal`):

- **Ticket Submission:** Dynamic department-specific ticket creation forms supporting custom fields.
- **Conversation Timeline:** Real-time message feeds displaying customer messages, staff replies, and file attachments.
- **Ticket Lifecycle Actions:** Customers can close resolved tickets or reopen conversations as needed.
- **CSAT Rating:** Inline satisfaction feedback modal prompting customers to rate resolved tickets (1–5 stars with review text).
- **Company Ticket Overview:** Corporate administrators can view, search, and manage all tickets submitted across their company's email domain.

---

### 5. Staff Ticketing Console & Queue Management

High-volume productivity workbench for support teams (`/staff`):

- **Saved Views & Custom Filters:** Fast tabbed switching across pre-configured ticket views (My Tickets, Unassigned, Pending, SLA At Risk).
- **Live SLA Countdown Badges:** Visual countdown badges indicating time remaining until first-response and full-resolution deadlines.
- **Bulk Operations:** Multi-select tickets to batch update assignment, status, or priority.
- **Live Search & Sorting:** Instant filtering by customer, priority, department, tags, and status.

---

### 6. Ticket Conversation & Collaboration

Advanced conversation workbench designed to prevent agent collision:

- **Live Agent Presence:** Instant warning badges alert agents when a colleague is actively viewing or typing on the same ticket.
- **Staff-Only Internal Notes:** Distinctly styled internal comments hidden from customer view for private team collaboration.
- **Canned Responses:** Searchable shortcuts and macro replies with placeholder variable insertion.
- **Tag Management & Watchers:** Add and remove operational tags and subscribe to ticket updates as a watcher.
- **Ticket Merging:** Merge duplicate tickets with a preview modal re-routing messages into a primary ticket thread.

---

### 7. Real-Time Streaming & Presence Detection

Dual-layer synchronization maintaining parity with the backend:

- **WebSocket Layer (Laravel Reverb):** Subscribes to private channels (`user.{id}`, `ticket.{id}`, `ticket.{id}.staff`) using Laravel Echo and Pusher JS.
- **Graceful Polling Fallback:** If WebSockets are unavailable or disconnected, screens automatically continue refreshing through standard HTTP polling.
- **Heartbeat Signals:** Active ticket screens dispatch a 15-second presence heartbeat to keep agent collision detection current.

---

### 8. Floating AI Support Assistant

Omnipresent floating chat bubble accessible across all portal and staff pages:

- **Role-Aware Scoping:** 
  - *Visitors:* Answers questions using published knowledge base articles.
  - *Customers:* Can also query their open tickets and check ticket progress.
  - *Staff:* Analyzes queues, drafts replies, and summarizes complex conversation threads.
- **Inline Assistant Tools:** Dedicated staff buttons for "Draft Reply" and "Summarize Conversation" directly within the ticket editor.

---

### 9. Direct-to-Cloudinary File Attachments

Client-side media pipeline that eliminates server upload bottlenecks:

- **Direct Uploads:** The browser retrieves a signed payload from the API and uploads binary files directly to Cloudinary using `XMLHttpRequest`.
- **Live Progress Bars:** Accurate percentage upload progress indicators for end users.
- **Validation:** Pre-upload validation for file extensions and maximum byte limits (10 MB for ticket attachments, 2 MB for avatars).

---

### 10. Team Lead & Administrative Suites

Management tools for operations and configuration:

- **Analytics Dashboard (`/staff/analytics`):** Real-time SLA compliance charts, customer satisfaction scores, and agent workload distribution.
- **Team Routing Controls (`/staff/team`):** Manage agent assignments, max capacity limits, and routing availability.
- **Knowledge Base Editor (`/staff/kb`):** Author, publish, and review search analytics for documentation.
- **System Administration:** Manage departments, custom ticket form fields, corporate holidays, SLA policy tiers, webhooks, and automation rules.

---

### 11. User Profile & Two-Factor Authentication

Personalized settings and security controls:

- **Profile Customization:** Update display name and upload profile photos directly to Cloudinary.
- **Two-Factor Enrolment:** Setup TOTP 2FA with generated QR codes and backup recovery codes.
- **Active Device Management:** View all signed-in sessions with device details and revoke active logins remotely.
- **GDPR Privacy Actions:** Customers can export their complete profile data or trigger self-service account erasure.

---

### 12. Visual Feedback & Toast System

Fluid notifications across all screen interactions:

- **Top-Right Alerts:** Custom animated toasts confirming asynchronous actions (reply sent, status changed, exported, saved).
- **Hover & Dismiss:** Toasts automatically pause when hovered and support manual dismissal.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React 19 · Vite 6 |
| **Routing** | React Router 7 |
| **Styling** | Tailwind CSS 3.4 · Custom Responsive Layouts |
| **HTTP Client** | Axios (with token interception and error normalization) |
| **Icons** | Lucide React |
| **Realtime** | Laravel Echo · Pusher JS |
| **Security & Utilities** | qrcode (TOTP 2FA) · Canvas Confetti |
| **Code Quality** | Oxlint · Playwright E2E |

---

## Routes & Access Matrix

| Path | Access Level | Description |
|---|---|---|
| `/` | Public | Landing page with knowledge base search |
| `/login`, `/register`, `/forgot-password` | Guests | Account authentication and registration |
| `/accept-invite` | Invited Staff | Staff invitation onboarding screen |
| `/help`, `/help/:slug` | Public | Knowledge base categories and article viewer |
| `/portal` | Customer | Customer ticket dashboard and support overview |
| `/portal/new` | Customer | New ticket creation form |
| `/portal/tickets/:id` | Customer | Customer conversation timeline and reply screen |
| `/portal/account` | Customer | Personal profile, 2FA, and GDPR privacy settings |
| `/staff` | Staff (`agent+`) | Ticket queue with saved views and bulk actions |
| `/staff/tickets/:id` | Staff (`agent+`) | Complete ticket workbench, notes, and AI assistant |
| `/staff/analytics` | `lead`, `admin` | Real-time SLA, CSAT, and workload analytics |
| `/staff/team` | `lead`, `admin` | Agent roster, capacity, and routing controls |
| `/staff/kb` | `lead`, `admin` | Knowledge base article management |
| `/staff/departments` | `admin` | Department configurations and custom ticket fields |
| `/staff/policies` | `admin` | Multi-tier SLA policy editor |
| `/staff/automation` | `admin` | Trigger-based automation rule engine |
| `/staff/integrations` | `admin` | Webhook management for external platforms |
| `/staff/audit` | `admin` | Global immutable audit logs viewer |

---

## Project Structure

```
deskflow-frontend/
├── src/
│   ├── api/
│   │   └── client.js              # Axios client, token store, and 401 interceptor
│   ├── context/
│   │   ├── AuthContext.jsx        # Auth state, session restoration, and 2FA
│   │   └── ToastContext.jsx       # Global animated toast notification system
│   ├── hooks/
│   │   ├── useTicketPresence.js   # 15s agent collision heartbeat
│   │   └── useSlaTimer.js         # Real-time countdown calculation
│   ├── lib/
│   │   ├── realtime.js            # Laravel Echo / Reverb integration
│   │   ├── upload.js              # Direct-to-Cloudinary upload helper
│   │   └── status.js              # State helpers and priority badge styles
│   ├── components/
│   │   ├── common/                # Modal, Dropdown, Avatar, PasswordInput, Badges
│   │   ├── navigation/            # Topbar, Sidebar, NotificationBell
│   │   ├── ticket/                # CannedResponses, Tags, Mentions, CollisionWarning
│   │   ├── sla/                   # SlaBadge live countdown component
│   │   └── assistant/             # Floating AssistantWidget component
│   ├── pages/
│   │   ├── landing/               # Public home & knowledge search
│   │   ├── auth/                  # Login, Register, ForgotPassword, AcceptInvite
│   │   ├── help/                  # Help center & article viewer
│   │   ├── portal/                # Customer tickets, new ticket, account
│   │   ├── staff/                 # Staff queues, analytics, team management
│   │   ├── tickets/               # Detailed ticket conversation workbench
│   │   └── admin/                 # Departments, SLA policies, webhooks, automation
│   ├── App.jsx                    # Route definitions, guards, and lazy-loaded routes
│   └── main.jsx                   # Application bootstrap
├── public/                        # Static assets, branding, and favicon
├── vercel.json                    # Single-page app routing rewrites for Vercel
└── vite.config.js                 # Vite build and plugin configurations
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Running instance of the [DeskFlow API](../deskflow-api)

### Installation & Local Run

1. **Navigate to the frontend folder:**
   ```bash
   cd deskflow/deskflow-frontend
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL` points to your backend:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api/v1
   ```

4. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000/api/v1` | Backend API base URL. *(Inlined at build time)* |
| `VITE_REVERB_APP_KEY` | *(unset)* | Reverb / Pusher application key for live WebSockets |
| `VITE_REVERB_HOST` | `window.location.hostname` | Reverb server host (e.g. `localhost` or domain) |
| `VITE_REVERB_PORT` | `8080` | Reverb WebSocket port |
| `VITE_REVERB_SCHEME` | `http` | Connection protocol (`http` or `https`) |
| `VITE_ENABLE_DEMO_SWITCHER` | *(unset)* | Set `true` in local development to display a fast demo role switcher |

> **Important:** Vite inlines `VITE_*` environment variables during `npm run build`. When deploying to Vercel, trigger a redeploy after modifying variables.

---

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| Development | `npm run dev` | Launches local Vite development server with HMR |
| Build | `npm run build` | Compiles optimized production bundle into `dist/` |
| Preview | `npm run preview` | Serves the compiled `dist/` build locally |
| Lint | `npm run lint` | Runs oxlint across all source files |
| E2E Tests | `npm run test:e2e` | Executes Playwright end-to-end browser tests |

---

## Architecture & Key Design Decisions

1. **Sanitized Base URLs:** Axios and Echo clients automatically strip trailing slashes from `VITE_API_URL`, preventing reverse proxies from returning 301 redirects that strip `Authorization` headers.
2. **Cold Boot Silent Authentication:** When restoring sessions from `localStorage` on page load, 401 errors on `/auth/me` silently clear the stored token rather than alerting the user with an unwanted "session expired" toast.
3. **Lazy-Loaded Staff Console:** The staff workspace and administrative modules are loaded dynamically via `React.lazy`, ensuring public visitors and customers never incur unnecessary bundle size penalties.
4. **Client-Direct Cloudinary Pipeline:** File uploads never route through the application backend, ensuring high throughput and zero server memory overhead during large file transfers.
5. **Decoupled Real-Time Architecture:** Real-time WebSocket pings are designed as an enhancement layer. If WebSockets are unavailable or disconnected, all views seamlessly fall back to HTTP polling.

---

## Deployment (Vercel & Docker)

### Deploying on Vercel

1. Import the repository in your [Vercel Dashboard](https://vercel.com).
2. Set the **Root Directory** to `deskflow-frontend`.
3. Choose the **Vite** framework preset:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. In Environment Variables, set:
   ```env
   VITE_API_URL=https://<your-backend-domain>/api/v1
   ```
5. Click **Deploy**. Deep links are automatically handled by [`vercel.json`](vercel.json).

### Running with Docker

```bash
docker build --build-arg VITE_API_URL=http://localhost:8000/api/v1 -t deskflow-frontend .
docker run -p 5173:80 deskflow-frontend
```
