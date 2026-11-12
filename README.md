# Remix of Remix of Remix of Refaat Status

Build "Refaat Uptime" — a premium, professional SaaS-style dashboard for monitoring the status of multiple Supabase projects across several accounts/organizations. This should feel like a polished commercial product (think Better Uptime, Vercel, or Statuspage), with rich motion design throughout.

Core Purpose

A real-time monitoring dashboard that tracks whether Supabase projects (across multiple organizations/accounts) are ACTIVE or PAUSED, with historical uptime logging.

Backend Architecture

Database tables:

monitored_projects — id, project_ref, project_name, organization_name, organization_label (a friendly name I assign to each account), created_at

status_logs — id, project_id (FK), status (active/paused/inactive/unknown), checked_at, response_time_ms

status_changes — id, project_id (FK), old_status, new_status, changed_at (for the activity feed)

Edge Function: check-project-statuses

Loops through stored secrets named SUPABASE_PAT_1, SUPABASE_PAT_2, SUPABASE_PAT_3 (support up to 5, gracefully skip if not set)

For each token, calls GET https://api.supabase.com/v1/projects with Authorization: Bearer {token}

Normalizes each project's status field (ACTIVE_HEALTHY, INACTIVE, PAUSED, COMING_UP, etc.) into a simplified status: active, paused, restarting, unknown

Upserts into monitored_projects, inserts a row into status_logs, and if status changed since last check, inserts into status_changes

Returns the full combined list as JSON

Can be triggered manually (via a button call) AND scheduled via pg_cron every 5 minutes for background logging

Security: Access tokens live only as Edge Function secrets, never exposed to the frontend or stored in any table.

Pages & Layout

1. Main Dashboard (/)

Header:

Left: "Refaat Uptime" logotype with a small animated pulse-ring icon beside it (continuous soft pulse animation, like a heartbeat monitor)

Right: live clock showing "Last checked: X seconds ago" that ticks up in real-time, dark/light mode toggle, manual refresh button (icon spins during fetch)

Stats bar (4 cards in a row):

Total Projects / Active / Paused / Average Uptime %

Each number animates with a count-up effect (0 → final value) on load and re-animates on refresh if the value changed

Small icon per card with a subtle bounce-in on mount

Filter bar:

Segmented control: All / Active / Paused / By Organization (dropdown)

Sliding pill/underline animation that glides between selected options

Search input to filter by project name, with smooth width expand on focus

Project grid:

Responsive card grid (3-4 columns desktop, 1 column mobile)

Each card contains:

Status dot: pulsing green (active) or solid red with subtle shake-once animation on becoming paused, surrounded by a soft glow/halo matching the status color

Project name (bold) + organization name/badge (smaller, muted)

Status badge (pill-shaped) that cross-fades when status changes

Mini sparkline (last 24h of checks) using a lightweight chart library

Uptime percentage for last 24h

"Last checked" relative timestamp

Card interactions: on hover, lift up 4-6px with an eased soft shadow, slight scale (1.02), border glow matching status color

On initial load, cards stagger in (fade + slide up), each ~50ms after the previous

When a project's status flips (detected on refresh), that specific card flashes a highlight overlay for ~2 seconds and gently shakes/pulses once to draw attention

Activity feed (sidebar or bottom section):

Chronological list of recent status changes ("جانّة Store went from Active → Paused, 3 minutes ago")

New entries slide in from the top with fade

Icon per entry (red down-arrow for paused, green up-arrow for restored)

2. Project Detail (optional, on card click)

Slide-over panel (not full page navigation) from the right, animated with spring easing

Larger uptime chart (7-day view), full history log table, organization info

Visual Design System

Theme: Dark mode as default, professional deep-space palette

Background: #0A0A0F (main), #13131A (cards)

Success/Active: #10B981 with glow rgba(16,185,129,0.4)

Danger/Paused: #EF4444 with glow rgba(239,68,68,0.4)

Accent/Interactive: #6366F1

Text: #F5F5F7 primary, #8B8B95 muted

Light mode toggle available with equivalent clean palette (white/soft gray backgrounds)

Cards use subtle glassmorphism: slight background blur + 1px border with low opacity

Font: Inter or Geist, tight tracking on headings

Use Framer Motion for all animations — spring-based easing (not linear), consistent timing (~200-300ms for micro-interactions, ~400-600ms for page transitions)

Skeleton loading state: animated shimmer gradient sweep across placeholder cards during first load (never a plain spinner)

Empty state: if no projects configured yet, show a friendly illustration/icon with a "Connect your first Supabase account" CTA

Behavior

Auto-refresh every 60 seconds silently in the background (no jarring reload — just data + animations updating in place)

Toast notification (slides in from top-right, auto-dismisses) whenever a status change is detected between refreshes

Responsive and fully usable on mobile

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3b6b59a6-71f1-428c-929c-609b2fedda5e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
