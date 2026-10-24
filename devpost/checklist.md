---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Paste an announcement and see the AI-built plan on screen**
  Becomes usable: A running Next.js app where pasting announcement text and clicking Scan shows the extracted title, deadline, ranked key details, guidance, and a checklist with best-by dates. Nothing is saved yet.
  Why now: The extraction is the riskiest unknown (Oxion model choice, JSON reliability) and the heart of the kernel; proving it first means every later slice builds on real output.
  PRD ref: `prd.md > Extraction and the plan`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Extractor (LLM)`, `spec.md > Planner`, `spec.md > LLM gateway: Oxion (default), River (fallback)`, `spec.md > File Structure`
  Build: Scaffold Next.js + TypeScript + Tailwind v4 per the file structure; add `.env.example`; Zod `ExtractionSchema`, prompt, `extract.ts` (Oxion via `openai` SDK, json_object, one retry); pure `plan.ts` (backward scheduling, tight, no-deadline, passed); `POST /api/scan` returning the plan (not-an-application / deadline-passed responses); a bare page with a textarea that renders the result.
  Verify (mechanical): `npm run build` passes; Vitest for `plan.ts` (normal, tight, no deadline, passed) passes; POST three real announcements (scholarship, job, non-application) to `/api/scan` and confirm the JSON parses and the non-application is rejected.
  Learner check: Run `npm run dev`, open http://localhost:3000, paste a real scholarship or job post, click Scan, and say whether the requirements, ranking, and best-by dates look right to you.
  Commit: `Extract a ranked, dated plan from a pasted announcement`

- [x] **2. Each scan becomes a saved, styled dashboard you can tick off**
  Becomes usable: Scanning saves the application to Supabase and opens `/a/[id]`: header with countdown, progress bar, colour-coded key details, guidance, and a checklist whose ticks survive reload. Shows the no-deadline and tight-deadline banners.
  Why now: The dashboard is the main surface in the demo and the thing reminders link to; it also proves the data model before email depends on it.
  PRD ref: `prd.md > Checklist and progress`, `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Data Model`, `spec.md > Application dashboard`, `spec.md > Item + application updates`, `spec.md > Look and Feel`
  Build: `supabase/schema.sql`; Supabase server/admin clients; save on scan; `/a/[id]` server page + dashboard components in palette D (dark default tokens); `PATCH /api/items/[itemId]` with optimistic UI; overdue flag.
  Verify (mechanical): `npm run build` passes; scan → row + items exist in Supabase; PATCH an item, reload `/a/[id]`, item still ticked; a no-deadline announcement renders the banner without dates.
  Learner check: Scan an announcement, land on its dashboard, tick two items, refresh the page, and tell me how the dashboard looks and feels compared to the style preview.
  Commit: `Save scans and add the application dashboard`

- [x] **3. A real reminder email lands in your inbox and links back**
  Becomes usable: Enter your email on the dashboard → magic link arrives → clicking it confirms and turns reminders on → "Send today's reminder now" delivers an email listing exactly the unticked items and days left, whose button opens the dashboard.
  Why now: This is the kernel and the demo's "oh, that's useful" moment; it lands before anything cosmetic.
  PRD ref: `prd.md > Email and magic link`, `prd.md > Daily reminders`
  Spec ref: `spec.md > Magic link (Supabase Auth)`, `spec.md > Email builder + sender`, `spec.md > Remind-now (demo trigger)`, `spec.md > Resend`, `spec.md > Supabase`
  Build: ReminderPanel (email input, "check your email", confirmed state); `signInWithOtp` with claim redirect; `/auth/callback` (session + claim); email templates (HTML + text); Resend sender; `POST /api/applications/[id]/remind-now`; real error messages on failure.
  Verify (mechanical): `npm run build` passes; magic link callback sets `user_id`, `email`, `reminders_enabled`; remind-now returns a Resend id; email HTML lists only unticked items and the correct days-left; a failed send shows the real error.
  Learner check: Enter your Resend account email, click the magic link in your inbox, tick one item, press "Send today's reminder now", open the email, and click Continue — you should land back on the same dashboard.
  Commit: `Add magic-link sign-in and reminder emails`

- [x] **4. Submit, follow up, and see all your applications**
  Becomes usable: "Mark as submitted" stops reminders and offers a one-time follow-up (default 14 days); `/applications` lists everything under your email; `/api/cron/daily` sends due daily reminders and follow-ups, at most once per day each.
  Why now: Closes the loop the PRD promises after the core email works; the cron route reuses slice 3's builder.
  PRD ref: `prd.md > Submit and follow-up`, `prd.md > My applications`, `prd.md > Daily reminders`
  Spec ref: `spec.md > Item + application updates`, `spec.md > Daily cron`, `spec.md > My applications`
  Build: SubmitPanel + `PATCH /api/applications/[id]`; `/applications` page (list + sign-in prompt + empty state); `GET /api/cron/daily` with `CRON_SECRET` check, two passes, `last_reminder_at` / `follow_up_sent` guards; `vercel.json` cron.
  Verify (mechanical): `npm run build` passes; curl the cron route with the secret → only in-progress, confirmed, not-yet-reminded applications get an email; second call same day sends nothing; set a past `follow_up_at` → exactly one follow-up sent; without the secret → 401.
  Learner check: Mark an application submitted, choose a follow-up, open My applications and check the statuses look right.
  Commit: `Add submit, follow-up, daily cron, and My applications`

- [x] **5. The landing page, scan progress, and pasting a link**
  Becomes usable: The Kariiya-style landing hero with the paste box, staged scan progress, link fetching with the blocked-link fallback, nav with My applications, and the dark/light toggle.
  Why now: The first impression for judges, built once the product underneath works; link fetch sits last because paste-text already covers the journey (it's the first thing to trim if time runs out).
  PRD ref: `prd.md > Input and scanning`, `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Landing page`, `spec.md > Scan flow (client)`, `spec.md > Page fetcher`, `spec.md > Theme toggle`
  Build: Hero, PasteBox, HowItWorks, DashboardPreview (labelled example); ScanProgress stages; `POST /api/fetch-page` + cheerio; theme toggle with no-flash script.
  Verify (mechanical): `npm run build` passes; a readable URL returns text; a blocked/JS-only URL returns `blocked: true` and the UI shows the fallback; theme persists across reload with no flash.
  Learner check: Open the landing page in both themes, paste a real link, watch the progress stages, and try one link that's likely blocked (e.g. a LinkedIn job).
  Commit: `Add landing page, scan progress, link fetching, and theme toggle`

- [ ] **6. Live on Vercel with daily reminders running**
  Becomes usable: A public URL friends can open, with the cron job scheduled, plus a README and MIT LICENSE ready for the public repo.
  Why now: Deployment depends on everything above; doing it last keeps local iteration fast, and it still leaves time for final review and the video.
  PRD ref: `prd.md > The Core Journey`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Vercel`
  Build: README (what/who/how to run/env vars), MIT LICENSE, Vercel project with env vars, Supabase redirect URLs, verify cron registered.
  Verify (mechanical): Production build succeeds on Vercel; full journey works on the live URL (scan → dashboard → magic link → remind-now email → link back); Vercel shows the cron job; no secrets in the repo (`git grep` for key prefixes).
  Learner check: Open the live URL on your phone, run the whole journey once, and tell me anything that feels off.
  Commit: `Add README, license, and deployment config`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 2 (dashboard look and plan quality, while there's time to change both). Feedback: section headings needed more visual hierarchy than body text → added SectionHeader with counts, stronger item titles, label/value key details (`2a7ee30`); learner confirmed it looks right.
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- Model id chosen from the key's live `/models` list (33 models) rather than docs — Oxion's docs list no ids; `scripts/list-models.mts` added.
- Extraction surfaces 503/429 as "busy or briefly down for maintenance" — during slice 1 Oxion returned `service_upgrading` 503 for every model; at the learner's request this became automatic failover to River (`LLM_FALLBACK_*`) in `lib/ai/extract.ts`; spec updated under the LLM gateway section and Important Failure Modes.
- Planner spaces items evenly across the time left and only pushes an item later for lead time, instead of packing efforts end to end — real fixture runs showed 11 overlapping tasks (50 effort-days) falsely flagged "tight" with 42 days left; spec `Planner` intent (backward from deadline, code owns dates) unchanged.
- Fallback model set to River `deepseek-ai/DeepSeek-V4.1-Flash` (6–9s, all fixtures correct; GLM-5.3-Flash was 21–29s). Oxion primary model is provisionally `gemini-3.7-flash`; its quality couldn't be compared yet because Oxion kept returning 503 — re-run `scripts/try-extract.mts` when it's stable.
- Checklist ticks stay authorised by the private dashboard link only, not also by the owning session as `spec.md > Item + application updates` said — email links are meant to work on any device without signing in, and requiring a session there would break that; the masked email on the page limits what a link-holder learns.
- Added `proxy.ts` (Next 16's renamed middleware) to refresh the Supabase session cookie on `/a/*` and `/applications`, which `@supabase/ssr` requires but the spec didn't list.
- Remind-now doesn't stamp `last_reminder_at`, so a demo send never suppresses that day's real cron reminder.
- Daily reminders also stop once an application's deadline has passed (cron filter `deadline >= today`) — the PRD only said they stop on submit, but reminding about a closed application is noise.
- `/a/[id]` and `/applications` call `connection()` before using today's date — Next 16 Cache Components flagged `Date.now()` during prerender.
- Link fetching refuses private/loopback addresses (DNS-resolved) — the server fetches user-supplied URLs, so without this anyone could make it probe internal networks (SSRF); not in the spec's Page fetcher.
- Nav moved into the root layout so every page has the logo, My applications and the theme toggle.
- Learner feedback before deploy: dashboard gained a left sidebar (compact New scan + My applications), a balanced two-column layout (Writing guidance goes in the shorter column based on content), and Delete application with owner check — PRD `My applications` and new `Deleting an application` updated.
- Magic links are now generated server-side (Supabase admin `generateLink`) and emailed by ApplyReady through the learner's own SMTP (Resend fallback) — the learner hit Supabase's built-in mailer rate limit; this also makes links work across browsers. Signing in adopts every application saved under that email; sign-out added; signed-out sidebar shows no applications.
- Scan box resets on return to the landing page — Next 16 keeps hidden pages alive with React `<Activity>`, so the finished progress panel persisted; fixed per Next's preserving-UI-state guide (clear input in the submit handler, clear progress in a `useLayoutEffect` cleanup).
- Logo and favicon added (`app/icon.svg`, `LogoMark`).
