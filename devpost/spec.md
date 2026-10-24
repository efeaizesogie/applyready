---
doc: spec
status: approved
---

# ApplyReady — Technical Spec

## How This Works, In Plain Language

ApplyReady is one Next.js app deployed on Vercel. It talks to three outside services:

- **An LLM** (via Oxion, an OpenAI-compatible gateway, with River as a drop-in fallback) reads the announcement and returns a structured JSON object: the title, deadline, ranked requirements, writing guidance, and checklist items. The app checks that JSON against a schema (Zod) before trusting it, the same way you'd validate a form submission.
- **Supabase** is the database (two tables: applications and checklist items) and also handles the magic-link sign-in. Supabase sends the "click to confirm" email itself, so we don't write any token logic.
- **Resend** sends our own emails: the daily reminder and the follow-up.

**Who does the date maths:** the AI proposes *what* needs doing, how important it is, and roughly how many days of work each item takes. Our code works out the best-by dates by counting backward from the deadline. LLMs are unreliable at calendar arithmetic, and code isn't. The same code also decides "deadline passed" and "tight deadline".

**How "daily" happens:** Vercel Cron is a timer Vercel runs for us. Once a day it calls one of our API routes (`/api/cron/daily`). That route asks the database "which applications are in progress, confirmed, and not yet reminded today?", builds each email from the unticked items, and sends it through Resend. The same route also sends any follow-up reminders that are due. For the demo, a "Send today's reminder now" button calls the same email-building code for one application, so the video shows the real email without waiting a day.

**Why this shape:** one repo and one deploy. Supabase gives us the database and magic-link login together, which saves a fourth service. Nothing runs in the background except one daily cron call.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Paste + Scan.** On the landing page, the user pastes a link or text and clicks **Scan**. If it's a URL, the browser calls `POST /api/fetch-page`. The server fetches the page, strips it to readable text, and returns `{ text }` or `{ blocked: true }`. If blocked, the UI shows the paste-text fallback.
2. **Extract.** The browser calls `POST /api/scan` with the text. The server sends it to the LLM with today's date and gets JSON back. Zod validates it. Code computes best-by dates and checks for a passed deadline or "not an application". If valid, it inserts one `applications` row plus its `checklist_items` rows and returns the application id. The progress view advances while these two calls run.
3. **Dashboard.** The browser navigates to `/a/[id]`. That page loads the application and its items from Supabase on the server. The id is an unguessable UUID, so the URL itself is the private link.
4. **Email + magic link.** The user enters their email. The browser calls Supabase `signInWithOtp` with a redirect to `/auth/callback?claim=[id]`. Supabase emails the link. Clicking it opens `/auth/callback`, which creates the session and **claims** the application: it sets `user_id`, `email`, and `reminders_enabled = true`. Then it redirects to `/a/[id]`.
5. **Tick.** Clicking a checklist item calls `PATCH /api/items/[itemId]`, which sets `done`. The UI updates instantly (optimistic) and reverts if the call fails.
6. **Daily reminder.** Vercel Cron calls `GET /api/cron/daily` (protected by `CRON_SECRET`). For each in-progress, confirmed application not reminded today, it builds the email (unticked items, overdue flags, days left, link to `/a/[id]`), sends it via Resend, and stamps `last_reminder_at`. The demo button calls `POST /api/applications/[id]/remind-now`, which uses the same builder.
7. **Submit.** **Mark as submitted** calls `PATCH /api/applications/[id]`, setting `status = 'submitted'` and `submitted_at`. Then the follow-up choice (yes/no + days, default 14) sets `follow_up_at` or leaves it null. The cron skips submitted applications for daily reminders.
8. **Follow-up.** The same daily cron finds rows where `follow_up_at <= now()` and `follow_up_sent = false`, sends one email, and sets `follow_up_sent = true`.
9. **Return.** Email links go to `/a/[id]`. `/applications` lists the signed-in user's applications (Supabase session cookie). Without a session it shows "Enter your email to see your applications" (magic link again).

## Stack

| Piece | Choice | Why | Docs |
|---|---|---|---|
| Framework | **Next.js (App Router), TypeScript**, latest stable from `create-next-app` | Learner's home turf; UI + API routes + cron endpoint in one repo | https://nextjs.org/docs |
| Styling | **Tailwind CSS v4**, palette as CSS variables | Learner's choice; tokens from `style-preview.html` map straight in | https://tailwindcss.com/docs |
| LLM | **Oxion** (OpenAI-compatible, `https://oxionai.com/v1`) via the `openai` npm SDK; **River** as fallback by swapping env vars | Learner has keys for both; Oxion's base URL and JSON mode are documented; free tier 0.5M tokens/month (~50 scans) | https://oxionai.com/docs/getting-started · https://river.ai · https://github.com/openai/openai-node |
| Validation | **Zod** | Validates LLM JSON and request bodies | https://zod.dev |
| Database + magic link | **Supabase** (Postgres + Auth OTP/magic link) via `@supabase/supabase-js` and `@supabase/ssr` | One service for data and passwordless sign-in | https://supabase.com/docs/guides/auth/auth-email-passwordless · https://supabase.com/docs/guides/auth/server-side/nextjs |
| Email | **Resend** via `resend` npm SDK | Simple API, free tier | https://resend.com/docs/send-with-nextjs |
| Scheduling | **Vercel Cron** (`vercel.json`) | Built into the host; one daily call | https://vercel.com/docs/cron-jobs |
| Page text | **cheerio** | Strip fetched HTML to readable text | https://cheerio.js.org |
| Dates | **date-fns** | Backward scheduling, days-left | https://date-fns.org |
| Font | **Inter** via `next/font/google`, JetBrains Mono for IDs | Linear-style type | https://nextjs.org/docs/app/getting-started/fonts |

**Unverified, check in build step 1:**
- Oxion: base URL and JSON mode are confirmed from its site; pick the exact model id from its models page (a GPT or Claude-class model with the JSON capability). We use `response_format: { type: "json_object" }` + Zod validation with one retry; try `json_schema` if the chosen model supports it.
- River (fallback only): docs weren't reachable from here; base URL and JSON support are unverified.
- Next.js and Tailwind versions: use whatever `create-next-app` installs.

## Where It Runs and How Someone Tries It

- **Deployed on Vercel** (learner's choice), so friends can use it. Hobby plan: Cron is limited to once per day, which is exactly what we need. It fires within the scheduled hour, not to the minute.
- **Local dev:** `npm install` → copy `.env.example` to `.env.local` and fill in keys → `npm run dev` → open http://localhost:3000.
- **Env vars** (`.env.example` lists them with no values):
  `LLM_API_KEY`, `LLM_BASE_URL` (default `https://oxionai.com/v1`), `LLM_MODEL`, optional `LLM_FALLBACK_API_KEY` / `LLM_FALLBACK_BASE_URL` / `LLM_FALLBACK_MODEL` (River), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `APP_URL`.
- **Deploy:** push to GitHub → import into Vercel → add env vars → set Supabase Auth "Site URL" and redirect URL to the Vercel domain.
- **Demo recording:** use the deployed URL. Scan a real announcement → dashboard → enter email → confirm magic link → tick items → **Send today's reminder now** → open the email in your inbox → click back.
- **No custom domain yet:** Resend's test sender (`onboarding@resend.dev`) only delivers to the Resend account owner's own email. That's fine for the demo (use your own inbox). Before friends can get reminders, verify a domain in Resend. Supabase's built-in auth emails go to anyone, but are rate-limited (a few per hour), which is fine for a demo.
- Submission still needs the demo video + public GitHub repo; the deploy is a bonus.

## Look and Feel
From `prd.md > Look and Feel`; visual reference `devpost/style-preview.html` (palette D).

- **Tokens as CSS variables** on `:root` (light) and `[data-theme="dark"]`, exposed to Tailwind v4 via `@theme inline`. Same values as the PRD: dark bg `#212227` / surface `#2A2B31` / raised `#33343B` / border `#3D3E46` / text `#F3F1EC` / muted `#A9A8B0` / accent `#D9706B`; light bg `#F1EDE5` / surface `#FBF9F5` / raised `#E8E3D9` / border `#DDD6CA` / text `#212227` / muted `#6A655E` / accent `#601E1D`. Importance: crit, imp, nice, plus ok green.
- **Theme:** dark default. A toggle stores the choice in `localStorage`, and a tiny inline script in `<head>` sets `data-theme` before paint (no flash).
- **Linear structure:** Inter 400/500/600, tight tracking on headings (-0.02 to -0.03em), 1px hairline borders, no drop shadows on cards, radius 6px for buttons/inputs and 12px for cards, pill badges, compact spacing. One accent-filled button per view.
- **Kariiya hero:** pill badge, centred headline with the accent phrase "shortlist-ready", sub-paragraph, paste box with Scan, 3-step strip, subtle 64px grid background, and a dashboard preview framed below.
- **Copy tone:** calm, direct, encouraging, never alarmist ("3 things left · 12 days").
- **Emails:** simple single-column HTML, light background, oxblood accent button, plain-text fallback.

## Components

### Landing page
`app/page.tsx` + `components/landing/*`. Hero, PasteBox, HowItWorks, DashboardPreview (static sample, labelled as an example). PasteBox owns the scan flow client-side.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Input and scanning`.

### Scan flow (client)
`components/scan/ScanProgress.tsx`. Stages: *Fetching page* (URL only) → *Reading requirements* → *Finding deadline* → *Building your plan*. Stage 1 completes when `/api/fetch-page` returns. Stages 2–4 advance on a timer while `/api/scan` runs, and all complete when it returns. Errors replace the progress with the right message (blocked / not an application / deadline passed).
PRD ref: `prd.md > Input and scanning`, `prd.md > States and Boundaries`.

### Page fetcher
`app/api/fetch-page/route.ts` + `lib/fetchPage.ts`. Server `fetch` with a browser-like User-Agent and an 8s timeout. Uses cheerio to drop script/style/nav/footer and collapse whitespace. **Blocked** if: non-2xx, timeout, non-HTML, or under ~400 characters of text (likely a login or JS-only page).
PRD ref: `prd.md > Input and scanning`.

### Extractor (LLM)
`app/api/scan/route.ts` + `lib/ai/extract.ts` + `lib/ai/schema.ts` + `lib/ai/prompt.ts`.
- Prompt includes today's date and the announcement text (truncated to ~30k chars).
- Asks for JSON matching `ExtractionSchema` (see Data Model): `isApplication`, `title`, `organization`, `type`, `deadline` (ISO date or null), `deadlineText`, `keyDetails[]` {label, value, importance}, `guidance[]` {piece, wordLimit?, points[]}, `checklist[]` {title, detail, importance, effortDays, order}.
- Zod-parse. On failure, one retry with the validation error appended. If it fails again, show "We couldn't read that announcement — try pasting the text."
PRD ref: `prd.md > Extraction and the plan`.

### Planner
`lib/plan.ts`. Pure function: (deadline, today, checklist) → items with `best_by`.
- No deadline → `best_by = null`, `deadlineStatus = 'none'`.
- Deadline < today → `closed`, don't save.
- Otherwise schedule backward from deadline − 1 day (buffer for submission), in `order`, each item ending `effortDays` before the next.
- If the total doesn't fit, compress proportionally to the available days and flag `tight = true`.

Items are sorted by importance, then best-by.
PRD ref: `prd.md > Extraction and the plan`, `prd.md > States and Boundaries`.

### Application dashboard
`app/a/[id]/page.tsx` (server component loads data) + `components/dashboard/*`: Header (title, chips, countdown), ProgressBar, KeyDetails (ranked, coloured), Checklist (+ ChecklistItem), Guidance, ReminderPanel (email input / confirmed state / **Send today's reminder now**), SubmitPanel (Mark as submitted → follow-up choice). Shows the "No fixed deadline" and "Tight deadline" banners where relevant.
PRD ref: `prd.md > Checklist and progress`, `prd.md > Screens and Layout`.

### Item + application updates
`app/api/items/[itemId]/route.ts` (PATCH done), `app/api/applications/[id]/route.ts` (PATCH status/follow-up). Authorised by possession of the application id (capability URL). After the application is claimed, the request must also come from the owning session.
PRD ref: `prd.md > Checklist and progress`, `prd.md > Submit and follow-up`.

### Magic link (Supabase Auth)
`lib/supabase/{client,server,admin}.ts`, `components/dashboard/ReminderPanel.tsx`, `app/auth/callback/route.ts`, `app/applications/page.tsx` (sign-in form when no session).
`signInWithOtp({ email, options: { emailRedirectTo: APP_URL + '/auth/callback?claim=' + id } })`. The callback runs `exchangeCodeForSession`, then the admin client updates the application (`user_id`, `email`, `reminders_enabled`).
PRD ref: `prd.md > Email and magic link`.

### Email builder + sender
`lib/email/templates.ts` (reminder, follow-up; returns `{ subject, html, text }`), `lib/email/send.ts` (Resend). Reminder subject: `"{title} · {n} days left"`. Body: unticked items (overdue flagged in red), a nudge to submit if all are ticked, and a **Continue where you stopped** button to `APP_URL/a/{id}`.
PRD ref: `prd.md > Daily reminders`, `prd.md > Submit and follow-up`.

### Daily cron
`app/api/cron/daily/route.ts` + `vercel.json` (`{"crons":[{"path":"/api/cron/daily","schedule":"0 7 * * *"}]}`, ~8am WAT). Checks `Authorization: Bearer ${CRON_SECRET}`. Two passes: (1) daily reminders for `status='in_progress' AND reminders_enabled AND (last_reminder_at is null or < today)`; (2) follow-ups due. Each send is independent, so one failure doesn't stop the rest.
PRD ref: `prd.md > Daily reminders`, `prd.md > Submit and follow-up`.

### Remind-now (demo trigger)
`app/api/applications/[id]/remind-now/route.ts`. Same builder and sender for one application. Requires a confirmed email. Labelled in the UI as "Send today's reminder now".
PRD ref: `prd.md > Daily reminders`.

### My applications
`app/applications/page.tsx`. Server-side list for the session user: title, type, deadline, days left, progress, status. Empty state links to the paste box.
PRD ref: `prd.md > My applications`.

### Theme toggle
`components/ThemeToggle.tsx` + inline script in `app/layout.tsx`.
PRD ref: `prd.md > Look and Feel`.

## Data Model

Supabase Postgres, created by `supabase/schema.sql` (run once in the SQL editor).

```sql
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),     -- null until magic link confirmed
  email text,
  reminders_enabled boolean not null default false,
  source_url text,
  title text not null,
  organization text,
  type text not null,                         -- scholarship | job | admission | grant | other
  deadline date,                              -- null = no fixed deadline
  deadline_text text,                         -- as written in the announcement
  tight boolean not null default false,
  key_details jsonb not null default '[]',    -- [{label, value, importance}]
  guidance jsonb not null default '[]',       -- [{piece, wordLimit, points[]}]
  status text not null default 'in_progress', -- in_progress | submitted
  submitted_at timestamptz,
  follow_up_at timestamptz,
  follow_up_sent boolean not null default false,
  last_reminder_at timestamptz,
  created_at timestamptz not null default now()
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  title text not null,
  detail text,
  importance text not null,                   -- critical | important | nice
  best_by date,
  done boolean not null default false,
  position int not null
);

alter table applications enable row level security;   -- no public policies:
alter table checklist_items enable row level security; -- all access goes through server routes with the service role key
```

**Where data lives and what survives:**
- **Applications + items** live in Supabase and are written on scan, tick, submit, and claim. They're all there when you come back from any device via the `/a/[id]` link.
- **Session** lives in a Supabase auth cookie and powers `/applications`. Without one, the email link still opens the dashboard.
- **Theme** lives in `localStorage`, per browser.
- **Scan progress** is in-memory only and gone after navigation (by design).

## File Structure

```
applyready/
├── app/
│   ├── layout.tsx                 # fonts, theme script, nav
│   ├── page.tsx                   # landing (hero + paste box)
│   ├── globals.css                # Tailwind + palette D tokens
│   ├── a/[id]/page.tsx            # application dashboard
│   ├── applications/page.tsx      # my applications / sign-in prompt
│   ├── auth/callback/route.ts     # magic link → session → claim application
│   └── api/
│       ├── fetch-page/route.ts    # URL → text or blocked
│       ├── scan/route.ts          # text → LLM → plan → save
│       ├── items/[itemId]/route.ts            # tick / untick
│       ├── applications/[id]/route.ts         # submit, follow-up choice
│       ├── applications/[id]/remind-now/route.ts  # demo trigger
│       └── cron/daily/route.ts    # daily reminders + follow-ups
├── components/
│   ├── landing/                   # Hero, PasteBox, HowItWorks, DashboardPreview
│   ├── scan/ScanProgress.tsx
│   ├── dashboard/                 # Header, ProgressBar, KeyDetails, Checklist, Guidance, ReminderPanel, SubmitPanel
│   ├── ui/                        # Button, Badge, Card, Input
│   └── ThemeToggle.tsx
├── lib/
│   ├── ai/{extract,schema,prompt}.ts
│   ├── plan.ts                    # backward scheduling (pure, tested)
│   ├── fetchPage.ts
│   ├── email/{templates,send}.ts
│   ├── supabase/{client,server,admin}.ts
│   └── db.ts                      # typed queries
├── supabase/schema.sql
├── tests/plan.test.ts             # Vitest: dates, tight, no-deadline, passed
├── vercel.json                    # cron schedule
├── .env.example
├── LICENSE                        # MIT (required: open source)
├── README.md
└── devpost/                       # planning docs (scope, prd, spec, checklist)
```

## External Services and Dependencies

### LLM gateway: Oxion (default), River (fallback)
- `new OpenAI({ apiKey: LLM_API_KEY, baseURL: LLM_BASE_URL })` → `client.chat.completions.create({ model: LLM_MODEL, messages, response_format: { type: "json_object" }, temperature: 0.2 })`.
- Response: `choices[0].message.content` is a JSON string, which we Zod-parse.
- Oxion: base URL `https://oxionai.com/v1`, OpenAI request/response shapes, JSON mode on models marked "JSON". Free 0.5M tokens/month; paid from $3.50/50M. An empty balance returns HTTP 402 (shown as "AI service unavailable"). Per-minute rate limits aren't published. Docs: https://oxionai.com/docs.
- **Automatic fallback (River):** if the primary returns any HTTP error (5xx, 429, 402), times out (30s), or the network fails, `extractAnnouncement` re-sends the same request to `LLM_FALLBACK_*` (River). Schema failures do not trigger the switch. With a fallback configured, the primary gets no SDK retries so failover is fast. River's base URL comes from the River console deployment; its JSON support is checked in slice 1.
- Build step 1: a one-off script sends a real announcement and checks the JSON parses against the schema.

### Supabase
- Auth: `supabase.auth.signInWithOtp`, `exchangeCodeForSession`. DB: `from('applications')...` using the service role on the server only.
- Keys: URL, anon key (public), service role key (server-only, never exposed to the client).
- Free tier is fine. Built-in auth email is rate-limited to a few per hour, which is acceptable for a demo; add custom SMTP later.
- Config: Auth → URL configuration → Site URL = deployed URL; add `http://localhost:3000/**` and `https://<vercel-domain>/**` to redirect URLs.

### Resend
- `resend.emails.send({ from: EMAIL_FROM, to, subject, html, text })` → `{ data: { id }, error }`.
- Free tier: 100/day. **Without a verified domain, sends only to the account owner's address** (from `onboarding@resend.dev`).

### Vercel
- Hobby: cron at most once per day, invoked within the scheduled hour. Sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set. Function timeout is enough for a few dozen emails.

## Important Failure Modes

- **Link blocked or JS-only page** → "We couldn't read that link. Paste the announcement text instead." Text box focused.
- **LLM returns malformed or partial JSON** → one retry with the Zod error appended; then "We couldn't read that announcement — try pasting the text." Nothing is saved.
- **Primary LLM down** (Oxion returned `service_upgrading` 503 during slice 1) → automatic failover to River; if both fail, "The AI service is busy or briefly down for maintenance. Try again in a minute." Nothing is saved.
- **LLM slow (>20s)** → progress keeps animating; at 45s, abort with a retry button.
- **Email not delivered** (Resend unverified domain, or Supabase rate limit) → the UI shows the actual error message ("Reminder couldn't be sent: …") rather than a false success. During the demo, use the account-owner email.
- **Cron misses a day** → `last_reminder_at < today` means the next run catches up. No duplicate sends on the same day.

## What Was Simplified and Why

- **Capability URL (`/a/[uuid]`)** instead of requiring login to view a dashboard. It keeps the scan → dashboard flow login-free and makes email links work on any device. The fuller version would require a session for every view and use row-level security policies.
- **Server routes + service role** instead of RLS policies. One access path is easier to reason about. The fuller version would write per-user RLS policies.
- **One daily cron pass** instead of per-user reminder times or a job queue. The fuller version would need a queue (e.g. Inngest) and stored timezone preferences.
- **Timed stage animation** for stages 2–4 of the scan progress, instead of true server streaming. The real work is one LLM call. Stage 1 (fetch) is real, and the final completion is real.
- **Resend test sender** instead of a verified domain for now. A domain is a later step before sharing with friends.

## Decisions and Open Issues

**Learner decisions**
- Next.js + TypeScript + Tailwind (home stack).
- LLM through an OpenAI-compatible gateway: Oxion by default (documented base URL + JSON mode), River as fallback; both keys already owned by the learner. *Confirmed by learner at review.*
- Deployed on Vercel so friends can use it; no custom domain yet, accepting Resend's own-inbox limit for the demo.
- From the PRD: magic link, email only, dark default, palette D.

**Derived implementation details (agent, from those choices)**
- Supabase for DB + magic link (avoids hand-rolled tokens); Vercel Cron for scheduling; Zod validation; code-computed best-by dates; capability URLs.

**The learner's useful unknown:** "how the output from the AI and scheduling the email works."
- *AI output:* the model is asked for JSON matching a schema. Code validates it (Zod), retries once on failure, and does the date maths itself instead of trusting the model with calendars. Check during the build: a Vitest suite for `lib/plan.ts` (normal, tight, no-deadline, passed), plus running 3 real announcements through `/api/scan` and inspecting the JSON.
- *Email scheduling:* nothing runs on its own. Vercel calls `/api/cron/daily` once a day, and that route decides who gets what based on database fields (`last_reminder_at`, `status`, `follow_up_at`). Check during the build: call the cron route locally with the secret header and watch exactly the expected emails go out, then confirm Vercel's Cron tab shows the job after deploy.

**Open issues**
- LLM model id: pick in build step 1 from Oxion's models page and verify JSON output with a real announcement. If output is weak, switch `LLM_MODEL` or gateway.
- Tight-deadline handling (compress + warn): carried from `prd.md > Open Questions`, implemented as described in Planner.
- **Build order for the deadline** (to protect the demo): scan → dashboard → magic link → remind-now email → submit/follow-up → cron → landing polish → URL fetch. If time runs short, URL fetch and the follow-up email are trimmed first; the reminder email never is.

## Post-build revisions (learner feedback before deploy)

### Email delivery: own SMTP with Resend fallback
`lib/email/send.ts` sends through the learner's own mailbox over SMTP (Nodemailer; e.g. Gmail + app password, ~500/day, any recipient) when `SMTP_HOST` is set, otherwise Resend. Reason: Supabase's built-in auth mailer is rate-limited to a few emails per hour, and Resend without a verified domain only reaches the account owner. Docs: https://nodemailer.com/smtp/ · https://support.google.com/accounts/answer/185833

### Magic links generated server-side
Replaces `signInWithOtp` + `/auth/callback` in `spec.md > Magic link (Supabase Auth)`. `POST /api/auth/magic-link {email, claim?}` calls `supabase.auth.admin.generateLink({ type: "magiclink" })` (creates the user if needed), emails our own link to `/auth/confirm?token_hash=…&claim=…` via `sendEmail`, with a 60-second per-address cooldown. `/auth/confirm` calls `verifyOtp({ type: "email", token_hash })`, claims the application, then `attachApplicationsByEmail` adopts every unowned application saved under that email. Token-hash links work in any browser (the PKCE flow required the same browser) and are single-use. `/auth/signout` (POST) ends the session.

### Dashboard additions
Left sidebar (compact New scan + My applications; empty with a sign-in link when signed out; Sign out when signed in), Writing guidance placed in the shorter column by estimated height, and `DELETE /api/applications/[id]` (unclaimed: capability link; claimed: owner session only). Favicon `app/icon.svg` and `LogoMark` share one mark: a ticked item on a list.

### Deliverability
Test emails from a personal Gmail landed in spam. Gmail SMTP already signs mail (DKIM for gmail.com), so the remaining signals are content and reputation: the sign-in email now uses specific, non-phishing wording ("Confirm your email for ApplyReady reminders") and shows the full link as text; reminder and follow-up emails carry `List-Unsubscribe` + `List-Unsubscribe-Post` (one-click, RFC 8058) pointing at `/api/applications/[id]/unsubscribe` (POST stops reminders; GET shows a confirmation page) plus a visible "Stop these reminders" footer link. Every "email sent" state in the UI tells the user to check spam/promotions and mark it "Not spam". Remaining levers, out of scope for the POC: deploying (public HTTPS links instead of localhost) and a custom sending domain with SPF/DKIM/DMARC.
