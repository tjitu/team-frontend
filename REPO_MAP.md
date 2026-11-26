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
* **Control Center & Bank Soal**: Auto-balance slot planner (`auto-balance-adjuster-modal.tsx`, `tryout-workflow-balancer.tsx`), curriculum gap analysis, question type (`PG`/`Isian`) composition controls, and QC workflows (`question-lifecycle-types.ts`). Question imports and prompt examples share section grouping and answer-format conventions in `question-solution-layout.ts`.
* Auto-balance distributes difficulty and supported answer formats per subtest in `question-slot-distribution.ts`; chunk prompts include their exact per-subtest allocations.
* **Tryout Table**: `tryout-table.tsx`, `tryout-table-actions.tsx`, and `tryout-table-types.ts` own the catalog table, stacked participant counts, lifecycle badge, and explicit force-delete action. Scoped token-based styles live in `tryout-table.module.css`; the page confirms history deletion before calling `?force=true`.
* **Tryout Participants**: `tryout-participants.tsx` lists registered students, temporary IRT ranks, and separate Benar/Salah/Kosong counts for finished attempts; administrators can reset an attempt. Tryout schedule inputs and table times use WIB.
* **UI & Styling**: Base UI + TanStack Table + Tailwind CSS using semantic tokens in `src/app/globals.css`, documented in [design.md](file:///C:/JITU-ECOSYSTEM/team-frontend/design.md) and [writing.md](file:///C:/JITU-ECOSYSTEM/team-frontend/writing.md).

* Chunked question prompts freeze slots per plan. The importer detects the JSON envelope, stores progress per member and destination in browser storage, and retries with a stable key per question.
