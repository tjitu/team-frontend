# writing.md — Team Frontend (`team-frontend`)

Reference for all UI copy in **Jitu Team Operations (`team-frontend`)**: workspace navigation, project/task management, Control Center & Bank Soal workflows, monitoring, and admin errors.

> **Mutable & Non-Limiting Contract.** This is a **living operational copy guide**, not a strict dictionary.
> - **Binding invariants:** concise, unambiguous, action-oriented labels; honest error/confirmation messages; consistent domain terminology.
> - **Flexible / non-limiting:** exact phrasing may adapt to workflow density; if the team shifts operational copy conventions, update this file rather than fighting it.

---

## 1. Voice & Language

- **Operational clarity over personality.** Unlike `jitu-frontend` (which talks to students like a friendly *kakak kelas*), `team-frontend` is an internal tool for staff, editors, and engineers. Be direct, neutral, and scannable.
- **Language convention:**
  - Use **concise English** for general workspace/platform chrome & generic table/CRUD UI (`Filter records...`, `No records found.`, `Save changes`, `Archive project`, `Status`, `Assignee`, `Updated`).
  - Keep **established Jitu/UTBK domain terms** intact where clearer (`Tryout`, `Subtest`, `Bank Soal`, `Soal Asli`, `Latihan`, `QC`, `PG / Isian`, `Draft`, `Publish`).
  - Avoid mixing languages awkwardly inside a single short phrase unless using a proper domain noun (e.g., `"Filter Tryout batches"` is fine; avoid half-translated sentences).

---

## 2. Clarity & Scannability Rules

1. **Verb-first actions:** Buttons state the exact action (`Create project`, `Approve draft`, `Run auto-balance`, `Invite member`). Avoid vague `"Submit"` or `"OK"`.
2. **Confirm destructive/irreversible actions:** State what will be affected and cannot be undone (`Archive this project? Members will lose edit access.`).
3. **Actionable errors:** State what failed and how to recover (`Failed to save task (version conflict). Reload to get the latest changes.`). Never use `"Oops!"` or casual jokes.
4. **Honest empty states:** State clearly what is missing and provide the next action if relevant (`No tasks match these filters.` / `No records found.`).
5. **No marketing fluff:** Zero hype words, zero hashtags, zero exclamation marks in operational chrome.

---

## 3. Microcopy Patterns (Reference)

| Context | Pattern |
| :--- | :--- |
| **Table search** | `Filter <items>...` (e.g., `Filter records...`, `Filter questions...`) |
| **Empty table / list** | `No <items> found.` or `No <items> match the current filters.` |
| **Destructive confirm** | Title: `<Action> <item>?` · Body: brief impact · Buttons: `<Action>` / `Cancel` |
| **Concurrency / version error** | `This item was updated by another teammate. Refresh and try again.` |
| **Auth / permission error** | `You don't have permission to perform this action.` / `Session expired. Sign in again.` |
| **Loading state** | Short present participle (`Saving...`, `Generating drafts...`, `Balancing slots...`) |
| **Success toast** | Short past-tense confirmation (`Task updated.`, `Batch approved.`, `Invitation sent.`) |

---

## 4. Quick Edit Pass

- [ ] Can an operator scan the button/column header in under 1 second?
- [ ] Are domain terms (`Tryout`, `Subtest`, `QC`, `Soal Asli`) spelled consistently?
- [ ] Do error messages tell the user *why* or *what to do next*?
- [ ] Are destructive actions explicitly confirmed?
