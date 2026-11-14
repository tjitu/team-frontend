# TEAM FRONTEND REPOSITORY MAP

> Quick reference for LLM agents. Consult before reading Team Frontend components.

---

## 1. Directory Structure

```
team-frontend/
├── src/
│   ├── app/              # Next.js 16 App Router (port 3100)
│   │   ├── (auth)/login/ # Supabase Auth login
│   │   ├── (workspace)/  # Protected team workspaces, projects, tasks
│   │   │   ├── projects/ # Project board, task list, member management
│   │   │   ├── monitoring/ # Health check dashboard for Main & Team services
│   │   │   └── ...
│   │   └── layout.tsx    # Root layout & Supabase session provider
│   ├── components/       # Workspace layout, sidebar, task tables, modals, Auto-Balance Engine (auto-balance-adjuster-modal.tsx, tryout-workflow-balancer.tsx)
│   ├── lib/              # Supabase browser/server client, API fetchers
│   └── types/            # TypeScript definitions for Projects, Tasks, Members
```

---

## 2. Key Architecture Patterns

* **Auth**: Supabase Auth with SSR cookie management (`@supabase/ssr`).
* **API Calls**: Sends Supabase JWT bearer token to `NEXT_PUBLIC_TEAM_API_URL` (`http://localhost:3200/api`).
* **Control Center & Bank Soal**: Auto-balance slot planner, curriculum gap analysis, question type (PG/Isian) composition controls, and QC workflows in `control-center/page.tsx` & `question-lifecycle-types.ts`.
* **UI**: Base UI + Tailwind CSS for headless accessible primitives.
