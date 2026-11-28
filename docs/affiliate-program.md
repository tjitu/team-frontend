# Affiliate workspace

The existing Team login, Supabase session, shell design tokens and Team/Referral
Management flows now include the Affiliate Program. Financial rules and rollout
instructions are in `jitu-backend/docs/affiliate-program.md`.

| Page | Purpose |
| --- | --- |
| /affiliate | Own performance, rates, trend and recent transactions |
| /affiliate/referrals | Read-only codes, results and copy action |
| /affiliate/boosts | Quotas, independent timers, confirmation and history |
| /affiliate/earnings | Journal-derived earnings and own payout history |
| /affiliate/agreement | Current/past agreements and unchecked acknowledgment |
| /affiliates | Administrative affiliate directory |
| /affiliates/:id | Individual performance, configuration, quotas, payouts and audit |
| /affiliates/agreements | Owner draft editor, preview and immutable publishing |

Internal menus are replaced with affiliate navigation for the new role. The
server proxy verifies membership and agreement state before serving protected
affiliate routes, and denies internal API routes. Missing auth configuration or
unavailable access checks fail closed. Backend authorization remains authoritative.

Add Team Member now offers Affiliator and optional username credentials. Owner
creation stays visibly reserved for bootstrap. Existing Referral Management has
a searchable Assigned Affiliator field; per-code rate controls are disabled when
assignment makes affiliate configuration authoritative. Configuration changes are
made on the individual affiliate detail page and tied to a published agreement.

Account creation from the Team form now runs in Next.js at `POST /api/team/members`
(port 3100). It verifies the Supabase session with `getUser`, checks the active
Team DB role, and rechecks that role under a row lock before saving. Owners alone
can create admins; Owner creation remains bootstrap-only. The Next server creates
the Auth user, Team membership and audit entry, plus initial Main affiliate terms.
Failed writes compensate only the newly created account. An uncertain commit is
preserved for reconciliation rather than deleting a potentially committed account.
Listing, role changes and other existing Team operations continue through NestJS.

Configure `TEAM_DATABASE_URL`, `JITU_CONTROL_CENTER_DATABASE_URL` and a valid Team
`SUPABASE_SECRET_KEY` in the Next server environment (`.env.local` locally), then
restart Next.js. These values must never have `NEXT_PUBLIC_` prefixes. Database TLS
verifies the hostname and official Supabase CA; custom CA PEM overrides are listed
in `.env.example`. Changing the request path cannot repair a revoked or invalid
Supabase admin key. No password is stored in membership, metadata or audit records.

The agreement editor supports headings, bold, lists, variables and preview through
a safe Markdown subset; HTML stays text. Acceptance requires a fresh server preview
hash and an unchecked acknowledgment. Accepted snapshots remain read-only.

Date filters use WIB day boundaries. Paid/outstanding values are labeled as
lifetime balances, pending values as estimates, and chart values as net commission.
Boost impact is reported before refund adjustments. Tables contain no customer PII.
Manual payout notes are restricted to administrative views. Production views query
database records and do not inject sample financial metrics.

Run `npm run build` and `npm run test:affiliate`. Browser QA used actual component
code with isolated local-database fixtures for desktop/mobile, dark mode, overflow,
boost confirmation and initially unchecked acknowledgment. It does not verify real
Supabase sign-in or a production payment. Complete the sandbox smoke test described
in the main release runbook before rollout.
