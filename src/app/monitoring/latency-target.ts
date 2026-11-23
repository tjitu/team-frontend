// The "website" checks now hit a bare JSON liveness route (no DB, no SSR
// render), so sub-100ms is realistic for them. The "API + database" checks
// still make a real round trip to Postgres and can legitimately sit above
// this on a cold start or a cross-region hop; flagging them above 100ms is
// intentional, not a bug — it is exactly the signal to chase next.
export const TARGET_LATENCY_MS = 100;
