# Team Frontend

Next.js frontend for the Jitu Academy team workspace.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

The app runs on `http://localhost:3100`. Set `NEXT_PUBLIC_TEAM_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. These Supabase values are the only provider-specific frontend configuration, so they can be swapped when moving to the company project.

The `/login` page signs in with Supabase Auth email and password. There is no public sign-up page; administrators provision users through Supabase Auth. The app stores and refreshes the session using `@supabase/ssr`, then sends the access token to the Team Platform API. Never expose a Supabase secret/service-role key in this frontend.

The admin **Monitoring** page checks the Team Platform frontend origin and the Team API readiness endpoint every 30 seconds while the page is open. Set `MONITOR_MAIN_URL` to the public Main website URL in the Team Frontend environment. `MONITOR_MAIN_API_HEALTH_URL` and `MONITOR_TEAM_URL` are optional overrides for the Main API health endpoint and Team Platform frontend URL. Latency samples and status transitions are kept only for the current browser session.

## Build

```bash
npm run build
npm start
```
