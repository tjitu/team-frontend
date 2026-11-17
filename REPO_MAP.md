# TEAM FRONTEND REPOSITORY MAP

> Quick reference for LLM agents. Consult before reading Team Frontend components. This file is mutable — update it when adding routes, components, or design patterns.

---

## 1. Directory Structure

```
team-frontend/
├── src/
│   ├── app/                  # Next.js 16 App Router (port 3100)
│   │   ├── login/, auth/     # Supabase Auth login & OAuth/session callback
│   │   ├── invitations/      # Team invitation acceptance
│   │   ├── workspaces/       # Workspace slug switcher
│   │   ├── control-center/   # Bank Soal, curriculum gap analysis, QC & auto-balance workflows
│   │   ├── projects/         # Project board, archived projects, project detail & activity
│   │   ├── tasks/            # Cross-project task views
│   │   ├── departments/      # Department views & management
│   │   ├── team/             # Team directory & role management
│   │   ├── activity/         # Global workspace activity feed
│   │   ├── marketing/        # Marketing operations & partnership sheets
│   │   ├── monitoring/       # Health & DB monitoring dashboard (+ /api/monitoring/*)
│   │   ├── settings/         # Workspace/user settings
│   │   ├── globals.css       # Operational dashboard tokens (light & .dark)
│   │   └── layout.tsx        # Root layout & Supabase session provider
│   ├── components/           # Workspace shell, DataTable, Auto-Balance modals, Practice/Soal Asli tables, Timeline
│   │   └── ui/               # Base UI + TanStack Table primitives (`data-table.tsx`, `table.tsx`, `combobox.tsx`, `breadcrumb.tsx`, `avatar.tsx`)
│   ├── lib/                  # Supabase browser/server client, API fetchers, session helpers
│   └── types/                # TypeScript definitions for Projects, Tasks, Members
├── design.md                 # Team Ops visual tokens & element guardrails
├── writing.md                # Team Ops operational copy & microcopy rules
└── AGENTS.md                 # Next.js 16 version & generated docs notice
```

---

## 2. Key Architecture Patterns

* **Auth**: Supabase Auth with SSR cookie management (`@supabase/ssr`).
* **API Calls**: Sends Supabase JWT bearer token to `NEXT_PUBLIC_TEAM_API_URL` (`http://localhost:3200/api`).
* **Control Center & Bank Soal**: Auto-balance slot planner (`auto-balance-adjuster-modal.tsx`, `tryout-workflow-balancer.tsx`), curriculum gap analysis, question type (`PG`/`Isian`) composition controls, and QC workflows (`question-lifecycle-types.ts`).
* **UI & Styling**: Base UI + TanStack Table + Tailwind CSS using semantic tokens in `src/app/globals.css`, documented in [design.md](file:///C:/JITU-ECOSYSTEM/team-frontend/design.md) and [writing.md](file:///C:/JITU-ECOSYSTEM/team-frontend/writing.md).
