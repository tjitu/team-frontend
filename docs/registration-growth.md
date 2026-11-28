# Team Registration & Growth

In Control Center, create or edit a tryout and open **Registration & Growth**:

1. Enable Social Engagement and choose whether manual approval is needed.
2. Set the Instagram profile and campaign post URLs. Choose enabled/required Follow, Like & Tag, Story and mention requirements.
3. Optionally enable the prize announcement, winner count (default 5), prize type (default Saldo E-Wallet) and additional information.
4. Optionally enable the community invitation and provide its HTTPS URL. New configuration can use the Team API's optional `JITU_COMMUNITY_URL` initial default.
5. Save the tryout. Server validation and configuration revisions prevent invalid settings and lost updates. An error can be retried after reloading current settings.

Existing tryouts default off. Disabling manual verification gives immediate access after the configured participant checklist; disabling Social Engagement preserves the old registration flow. Prize/community are independent toggles. Settings are persisted in the Main DB and load dynamically on registration; no redeployment is needed for campaign changes.

## Review queue

Open a tryout's existing participants dialog → **Verifikasi pendaftaran**. Owner/Admin can view total/pending/approved/rejected metrics, search name/email/Instagram, filter status and WIB dates, paginate, and prioritize unreviewed Stories. Default queue order is oldest first. Stale search responses cannot overwrite newer results.

Open **Periksa** to review the participant's declarations and the independent administrator checklist. Only configured checks appear. Required checks must be confirmed before approval. Instagram/JITU/campaign links open new tabs. **Simpan progres** retains partial checks. **Tolak** requires predefined reasons and/or custom text; multiple reasons are supported. **Simpan & berikutnya** applies the selected decision and opens the next pending submission. History retains submission/resubmission, administrator actions and actor/time attribution.

The review dialog uses the native accessible modal for focus isolation and Escape; it is scrollable on short/mobile screens and uses existing light/dark design tokens. Private accounts and Stories that have disappeared require manual judgment. Story expiry never changes status automatically.

The analytics panel shows conversion, abandonment, decision rates, average review time and community invitation CTR. It explicitly distinguishes participant declarations from verified Instagram activity, and clicks from confirmed community membership.

## Deployment and verification

Deploy the Main DB growth migrations and updated Team/Main APIs before enabling this UI. No new frontend environment variable or browser secret is needed. Backend authorization independently blocks Member/Affiliator access, including forged requests.

`npm run test:growth`: 4 tests for independent/admin checklist derivation, disabled/optional requirements, rejection reasons and WIB timestamps. Production build passes; existing affiliate/account UI regressions pass (22 additional cases).

A separate isolated Chromium run used the actual queue/review components and Team service with local PostgreSQL. It passed partial save, rejection reasons, correction/resubmission/approval, Save & Next, search/status filtering, 390×844 dark layout, keyboard focus isolation and Escape. Session authorization was substituted in that local harness; no real Supabase users were created. Instagram checks and membership confirmation remain manual, and participant notifications are in-app polling only. See `registration-growth-files.md` for the source inventory.
