# ApplyReady

**Every application, shortlist-ready.** Paste a scholarship, job, admission or grant announcement. ApplyReady pulls out every requirement, ranks what matters, plans each step back from the deadline, and emails you every day until you've submitted — then reminds you to follow up.

Built for graduates juggling many applications who don't miss opportunities because they can't *find* them, but because essays, documents and lead time slip. A chat answer goes quiet once you close it; ApplyReady keeps reminding you.

## What it does

- **Paste a link or the text.** Links are read server-side; if a site blocks reading (logins, JavaScript-only pages), you're asked to paste the text instead.
- **AI extraction with a schema.** The announcement becomes structured data: eligibility and key details ranked *Critical / Important / Nice to have*, writing guidance for each essay, cover letter or CV, and a checklist with effort estimates. Output is validated with Zod and retried once if malformed.
- **Code does the dates.** Best-by dates are computed backward from the deadline in `lib/plan.ts` (unit-tested), spacing tasks across the time left and flagging genuinely tight deadlines. Passed deadlines and non-applications are rejected up front.
- **A dashboard per application** with a countdown, progress, overdue flags and tickable checklist.
- **Magic-link email** (no passwords, works on any device) ties every application saved under your email to you and turns on reminders.
- **Daily reminder emails** list exactly what's still unticked, with days left and a link straight back. A *Send today's reminder now* button shows it instantly.
- **Mark as submitted** stops reminders and optionally schedules one follow-up nudge (default 14 days).
- **AI failover.** If the primary LLM gateway is down, the same request goes to a fallback provider automatically.
- Dark by default, light on toggle.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · OpenAI-compatible LLM gateway (Oxion, with River as fallback) · Zod · Supabase (Postgres + magic-link auth) · Nodemailer (SMTP) / Resend · Vercel Cron · cheerio · date-fns · Vitest

## Run it locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

1. **LLM:** `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` for any OpenAI-compatible endpoint. Optional `LLM_FALLBACK_*` for automatic failover.
2. **Supabase:** create a project, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor, and copy the project URL, anon key and service-role key. Under *Authentication → URL Configuration* set the Site URL to your app URL and add `<your-url>/**` to Redirect URLs.
3. **Email:** set `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`EMAIL_FROM` to send from your own mailbox (e.g. Gmail with an [app password](https://myaccount.google.com/apppasswords)). Otherwise `RESEND_API_KEY` is used; without a verified domain, Resend only delivers to your own account email.
4. **Cron:** set `CRON_SECRET` to any long random string. Locally, trigger the daily run with
   `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily`.

```bash
npm test                                                   # planner unit tests
npx tsx --env-file=.env.local scripts/try-extract.mts      # run real announcements through the extractor
```

## Deploy

Import the repo into Vercel, add the same environment variables (with `APP_URL` set to the deployed URL), and update Supabase's Site URL / Redirect URLs. `vercel.json` schedules `/api/cron/daily` once a day; Vercel sends `CRON_SECRET` automatically.

## How it was built

Built for Devpost's **Build With AI: Basics** hackathon using the [Devpost Learn Skill Pack](https://github.com/challengepost/learn-ai-basics) with Claude Code. Planning came first — the scope, product requirements, technical spec and sliced build checklist live in [`devpost/`](devpost/):
[`scope.md`](devpost/scope.md) · [`prd.md`](devpost/prd.md) · [`spec.md`](devpost/spec.md) · [`checklist.md`](devpost/checklist.md)

Pre-existing code: the project was started from the standard `create-next-app` template; everything else was written during the submission period with an AI coding assistant.

## License

[MIT](LICENSE)
