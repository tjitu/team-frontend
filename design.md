# design.md — Team Frontend (`team-frontend`)

Visual language for **Jitu Team Operations (`team-frontend`, `:3100`)**: internal workspace, project/task boards, Control Center & Bank Soal workflows, monitoring, and team access management.

**Character:** crisp, high-clarity operational dashboard. Neutral grayscale surfaces (`#ffffff` / `#f7f6f6` / `#0a0a0a`) keep dense tables and status workflows legible, while semantic accents are reserved strictly for status, timeline state, and validation.

> **Mutable & Non-Limiting Contract.** This document is a **living element-level guide**, not a layout cage.
> - **Binding invariants:** use existing semantic CSS tokens (`src/app/globals.css`), support both light & `.dark` themes, maintain clear contrast and keyboard/focus accessibility, and cover all interactive states (hover/focus/disabled/loading/empty/error).
> - **Flexible / non-limiting:** information density, column layouts, specialized workflows (e.g., Auto-Balance Adjuster, Control Center matrices, Kanban/Timeline views), and new operational widgets.
> - **Living updates:** If a sprint refactors tokens or introduces reusable UI patterns, update this file to match reality.

---

## 1. Core Principles

1. **Neutral chrome, semantic signal.** Workspace chrome stays monochrome (`--background`, `--card`, `--sidebar-bg`, `--border`) so task status, QC badges, and alerts stand out immediately.
2. **Density with breathing room.** Operational tables and forms can be compact, but never cramped: align baselines, tabular numbers, and clear row/section dividers (`--border`).
3. **Borders and subtle elevation.** Use `1px solid var(--border)` for containment (`--card`, `--surface-input`); reserve `--shadow-dialog` for floating modals/popovers.
4. **Dual theme parity.** Every new surface, badge, or custom CSS rule must work cleanly in both light (`:root`) and dark (`html.dark, :root.dark`).

---

## 2. Color & Tokens (`src/app/globals.css`)

Always reference CSS variables from `team-frontend/src/app/globals.css` rather than hardcoding hex colors:

| Role | Semantic Token (Active) | Light | Dark |
| :--- | :--- | :--- | :--- |
| Page / Canvas | `--background` / `--canvas` | `#ffffff` / `#f7f6f6` | `#0a0a0a` |
| Card / Popover | `--card` / `--popover` | `#ffffff` | `#171717` |
| Muted / Secondary | `--secondary` / `--muted-bg` | `#f5f5f5` | `#262626` |
| Sidebar | `--sidebar-bg` / `--sidebar-fg` | `#f7f6f6` / `#646464` | `#171717` / `#b0b0b0` |
| Primary Action | `--primary` / `--primary-foreground` | `#171717` / `#fafafa` | `#e5e5e5` / `#171717` |
| Text | `--foreground` / `--muted-fg` | `#0a0a0a` / `#737373` | `#fafafa` / `#a1a1a1` |
| Border / Input / Ring | `--border` / `--input` / `--ring` | `#e5e5e5` / `#e5e5e5` / `#a1a1a1` | `rgba(255,255,255,0.1)` / `0.15` / `#737373` |
| Destructive / Error | `--destructive` (`--danger` / `--danger-tint`) | `#e40014` | `#ff6568` |
| Success | `--success` / `--success-tint` | `#16a34a` / `#f0fdf4` | dark semantic variants |
| Timeline States | `--timeline-todo`, `-progress`, `-blocked`, `-done` | neutral / dark / amber / green | dark semantic variants |

> **Note:** Legacy tokens (`--ink`, `--paper`, `--surface`, `--brand`, `--line`) are mapped in `src/app/globals.css`. Prefer semantic dashboard tokens (`--background`, `--card`, `--primary`, `--muted-fg`, `--border`) for new Base UI / Tailwind components.

---

## 3. Typography & Shape

- **Font:** `Inter, "Segoe UI", Arial, sans-serif` (`--font-body`), tabular numerals (`tabular-nums`) for counts, quotas, timestamps, and metrics.
- **Radius:** `--radius-sm` (`0.375rem` / `6px`) for chips/compact controls · `--radius` (`0.625rem` / `10px`) default for buttons/inputs/cards · `--radius-lg` (`0.75rem` / `12px`) for large panels/modals.
- **Iconography:** `lucide-react` stroke icons, sized consistently (`16px` inline/table actions, `18-20px` sidebar/topbar).

---

## 4. Element Guardrails (Extendable)

Built on **Base UI + Tailwind CSS + TanStack Table (`src/components/ui/`)**.

| Elemen | Karakter Standar | Ruang Fleksibilitas |
| :--- | :--- | :--- |
| **Workspace Shell & Nav** | Collapsible sidebar (`--sidebar-bg`, `--sidebar-border`), top breadcrumb bar (`ui/breadcrumb.tsx`), theme toggle, notification/activity triggers. | Sub-routes like `control-center` or `monitoring` may add secondary sub-navigation tabs or filter bars. |
| **Buttons** | Primary (`--primary` / `--primary-foreground`), Secondary/Outline (`--card` + `1px --border`), Ghost, Destructive (`--destructive`). Loading disables interaction cleanly without layout shift. | Compact heights (`32-36px`) are encouraged inside table row actions, toolbars, and bulk-action bars. |
| **Inputs, Select & Combobox** | `--surface-input`, `1px --input` border, clear focus `--ring`, `ui/combobox.tsx` for searchable assignee/project/department pickers. Always pair with label or clear `aria-label`. | Inline table cell editing, multi-filter toolbars, and batch fields (`question-batch-field.tsx`) may adapt spacing for density. |
| **DataTable & Tables** | Powered by `@tanstack/react-table` (`ui/data-table.tsx`, `ui/table.tsx`). Crisp header separation, sortable indicators, search/filter bar, pagination, right-aligned numeric/count columns. | Row selection, expandable details, sticky headers, and domain cell renderers (`practice-table-cells.tsx`) can be tailored per workflow. |
| **Cards & Panels** | `--card`, `1px --border`, `--radius`, restrained padding (`16-24px`). | Dense metric strips, kanban cards, and balancer panels (`tryout-workflow-balancer.tsx`) may use tighter padding (`12-16px`). |
| **Status Badges & Timeline** | Soft tinted backgrounds + high-contrast text + icon/label (never color alone). Use `--timeline-*` tokens for task progress states. | Custom QC lifecycle tags (`question-lifecycle-types.ts`) and batch chips are encouraged when workflows need finer states. |
| **Modals & Sheets** | `--popover` / `--card`, `1px --border`, `--shadow-dialog`, `--overlay-scrim`, `Esc` closes, focus trapped. | Choose centered modal, slide-over sheet (`partnership-sheet.tsx`), or adjuster modal (`auto-balance-adjuster-modal.tsx`) based on form complexity. |
| **Empty, Loading & Error States** | Clear empty message (`emptyMessage`), skeleton/loading state that avoids layout jump, inline error banner with recovery action. | Optimistic updates and inline retry buttons are encouraged for frequent Kanban/Control Center mutations. |

---

## 5. Anti-Slop Checklist (Team Ops)

- [ ] Works cleanly in both Light and Dark mode (`:root` and `.dark`).
- [ ] All interactive controls have clear hover, focus-visible, disabled, and loading states.
- [ ] Status is never conveyed by color alone (always include text label or icon).
- [ ] Dense tables keep horizontal overflow contained inside the table wrapper on smaller screens.
- [ ] No hardcoded light-only hex colors where semantic CSS variables exist.
