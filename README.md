# Productivity Dashboard

A personal productivity dashboard for tracking daily goals, weekly and monthly
reviews, streaks, and startup progress. Designed for long-term daily use with
a clean dark UI.

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Zustand, Recharts, @dnd-kit
- **Backend:** Supabase (Postgres + Auth + Row Level Security)
- **Hosting:** GitHub Pages (static)

---

## Features

- Supabase email/password auth with session persistence, password reset, and
  protected routes
- Daily checklist with checkbox, numeric, and duration goals, drag-to-reorder,
  and instant Supabase sync
- Pie charts for daily / weekly / monthly completion, quick stats, streaks,
  and trend line
- Weekly review with stacked bar chart and a saved reflection
- Monthly review with a calendar heatmap and saved reflection
- Metrics page with streaks and 60-day completion trend
- Customizable dashboard: drag widgets, reorder, show/hide, persisted to
  Supabase per-user
- Startup tracker (minutes, revenue, tasks) with area and bar charts
- Settings: export data (JSON), import data, reset account
- Fully responsive with collapsible sidebar on mobile

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Create your Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates all tables, indexes, and Row Level Security policies.
3. In **Authentication → Providers**, enable **Email**. For quick local
   testing you can turn off email confirmation in **Authentication → Settings**.
4. In **Authentication → URL Configuration**, add your local dev URL
   (`http://localhost:5173`) and, once deployed, your GitHub Pages URL to the
   list of redirect URLs.

### 3. Set environment variables

Copy `.env.example` to `.env` and fill in your project values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Register an account, then
start adding goals.

---

## Project structure

```
src/
├── components/        Reusable UI (Sidebar, TopBar, Checklist, …)
├── context/           AuthContext (Supabase session)
├── hooks/             Data hooks (useGoals, useGoalEntries, …)
├── lib/               Supabase client
├── pages/             Route views (Dashboard, Goals, Weekly/Monthly Review, …)
├── store/             Zustand store (layout, UI state, startup tracker)
├── types/             Shared TypeScript types
└── utils/             Date and formatting helpers
supabase/
└── schema.sql         Tables + indexes + RLS policies
```

---

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and publishes the site
from `main` or `master` on every push.

### One-time setup

1. **Repository settings → Pages:** set the source to **GitHub Actions**.
2. **Repository settings → Secrets and variables → Actions:**
   - Add secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - If your site is served at `https://<user>.github.io/<repo>/`, you can
     leave `VITE_BASE` alone — the workflow defaults to `/<repo-name>/`.
   - For a custom domain or user/org site at the root, set a repository
     **variable** named `VITE_BASE` to `/`.
3. Add your Pages URL to Supabase **Authentication → URL Configuration**
   so auth redirects resolve.

### Routing

The workflow copies `index.html` to `404.html` after the build so refreshes on
deep links (e.g. `/goals`) work on GitHub Pages.

---

## Scripts

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start local dev server on port 5173       |
| `npm run build`   | Type-check and produce a production build |
| `npm run preview` | Preview the production build locally      |
| `npm run lint`   | Run ESLint                                 |

---

## Data model

Every table carries `user_id` and is protected by Row Level Security so users
only ever see and modify their own rows.

- `goals` — tracked goals (name, frequency, type, target, category, position, archived)
- `goal_entries` — one row per (goal, date) with value + computed status
- `reflections` — weekly / monthly reflections keyed by start-of-period date
- `dashboard_layouts` — per-user dashboard layout JSON

See [`supabase/schema.sql`](supabase/schema.sql) for the full schema.
