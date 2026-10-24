---
doc: prd
status: approved
---

# ApplyReady — Product Requirements

ApplyReady turns a scholarship, job, admissions, or grant announcement into a deadline-paced checklist that emails you every day until you've submitted, then reminds you to follow up. Built for graduates who keep losing applications in execution, not discovery.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. **Arrive.** A first-time visitor lands on the landing page. The hero has a headline, a short paragraph explaining ApplyReady, and the input box right there: paste a link or the announcement text, then **Scan**.
2. **Scan.** A progress view replaces the input and shows each stage as it happens (e.g. fetching page → reading requirements → finding deadline → building your plan), with a spinner on the current stage and ticks on completed ones.
3. **Dashboard.** They land on that application's dashboard: key details ranked and colour-coded by importance, essay/cover letter/CV guidance, the deadline countdown, and a checklist where every item has its own "best done by" date working backward from the deadline.
4. **Save + reminders.** A prompt on the dashboard asks for their email. ApplyReady sends a magic link; clicking it confirms the email and saves the application under it. No password, no signup form.
5. **Work through it.** A short hint tells them: tick an item when it's done so ApplyReady knows. Progress updates as they tick.
6. **Daily reminder.** Each day, an email lists the unticked items, which ones are overdue against their best-by date, and days left, with a private link straight back to this dashboard.
7. **Submit.** They tick everything and press **Mark as submitted**. Daily reminders stop. They're asked whether they want a follow-up reminder and when (default: 2 weeks after submission).
8. **Follow up.** If they opted in, one follow-up reminder email arrives at the chosen time.
9. **Return.** From any email link they land back on their applications without logging in. **My applications** lists every application saved under their email.

**Success:** a real email lands in a real inbox, naming exactly what's still undone, and its link opens the right dashboard.

## Screens and Layout

1. **Landing page:** top nav (logo, theme toggle, "My applications"); hero with a small pill badge above the headline, a large headline with one accent-coloured word, a short paragraph, and the paste box + **Scan** button; below it, a brief "how it works" (paste → plan → reminders) and a product preview of a dashboard.
2. **Scan progress:** replaces the hero input in place (or a focused view): stage list with spinner/ticks.
3. **Application dashboard:** header with title, organisation, type (scholarship/job/admission/grant), deadline + countdown, progress bar. Ranked key details with importance colour. Guidance section (essay / cover letter / CV). Checklist with best-by dates and tick boxes. Email/reminder panel. **Mark as submitted** action.
4. **My applications:** list of all applications under the email: title, type, deadline, days left, progress, status (in progress / submitted / closed).
5. **Magic link confirmation:** a simple "Check your email" state, and a landing state when the link is clicked ("You're in — reminders are on").
6. **Emails (not screens, but designed surfaces):** magic link, daily reminder, follow-up reminder.

## Look and Feel
Source: learner's references: Linear (structure), Kariiya landing page screenshot (hero composition), learner-chosen "Charcoal & Oxblood" palette (colour). Visual reference: `devpost/style-preview.html` (palette D).

- **Structure from Linear:** Inter, tight tracking on large headings (-0.022em), medium weights (400–590, no heavy bold), hairline borders instead of shadows, 6px buttons/inputs, 12px cards, pill badges, compact spacing, product-UI-as-imagery, one primary action per view.
- **Hero composition from the Kariiya reference:** pill badge above the headline, big centred headline with one accent-coloured word, short paragraph, primary CTA, product dashboard preview under the hero, subtle grid background.
- **Colour: Charcoal & Oxblood** (learner's picks: dark `#212227`, light `#F1EDE5`, accent `#601E1D`). Earlier Linen & Clay was rejected for weak contrast.
  - **Dark (default):** background `#212227`, surface `#2A2B31`, raised `#33343B`, border `#3D3E46`, text `#F3F1EC`, muted `#A9A8B0`, accent `#D9706B` (a lifted tint of `#601E1D`, because the raw oxblood is ~1.3:1 on charcoal).
  - **Light:** background `#F1EDE5`, surface `#FBF9F5`, raised `#E8E3D9`, border `#DDD6CA`, text `#212227`, muted `#6A655E`, accent `#601E1D` (~10:1).
  - Accent is reserved for primary actions and emphasis (one accent word in the hero, progress, active states).
- **Dark mode is the default**, with a toggle to light and back.
- **Importance colours** (separate from the accent, each always paired with a text label): Critical = red (`#FF6B6B` dark / `#D03B3B` light), Important = amber (`#F5B942` / `#A6680C`), Nice to have = grey (muted). Overdue best-by dates use the Critical red.
- **Feel:** calm and organised, not a nagging alarm.

## Features and Behavior

### Input and scanning
Source: `scope.md > The POC Boundary`.
- Paste box accepts a URL or plain text. **Scan** starts the process.
- For a URL, ApplyReady fetches the page. If the page is blocked or unreadable, it shows: "We couldn't read that link. Paste the announcement text instead," with the text box ready.
- Progress view names each stage and shows which are done.
- [ ] Pasting a working URL and clicking Scan shows the staged progress, then the dashboard.
- [ ] Pasting a blocked URL shows the blocked-link warning and a ready text box; pasting the text then works.
- [ ] Pasting plain text skips the fetch stage and still reaches the dashboard.

### Extraction and the plan
Source: `scope.md > The Unique Kernel`.
- From the announcement, ApplyReady extracts: title, organisation, type, deadline, eligibility, required documents, essays/statements, submission steps.
- Each detail and checklist item is ranked Critical / Important / Nice to have and colour-coded.
- Guidance for each writing piece (essay, statement of purpose, cover letter, CV): what it must cover and how to structure it for this application. Guidance only, no ghostwriting.
- Every checklist item gets a best-by date, spaced backward from the deadline so everything fits.
- [ ] Dashboard shows the deadline and an accurate days-left countdown.
- [ ] Every checklist item shows an importance label + colour and a best-by date before the deadline.
- [ ] Guidance appears for each writing piece the announcement asks for.
- [ ] Items are ordered by importance, then by best-by date.

### Checklist and progress
- Ticking an item marks it done, updates the progress bar, and persists.
- Items past their best-by date and still unticked show as overdue.
- [ ] Ticking an item updates progress immediately and is still ticked after reload.
- [ ] An unticked item past its best-by date is visibly marked overdue.

### Email and magic link
- Dashboard prompts: "Get daily reminders — enter your email." Submitting sends a magic link email.
- Clicking the link confirms the email, saves the application under it, and turns reminders on.
- Entering an email that already has applications adds this one to the same list.
- [ ] Entering an email shows "Check your email"; a magic link email arrives.
- [ ] Clicking the link opens the dashboard with reminders on, and the application appears in My applications.

### Daily reminders
Source: `scope.md > The Core Loop` step 4.
- Once a day, for each in-progress application: subject with title + days left; body listing unticked items (overdue ones flagged), and a private link back to the dashboard.
- Reminders stop when the application is marked submitted.
- **Demo trigger:** a visible "Send today's reminder now" control sends the reminder immediately, so the video can show the next-day email.
- [ ] Clicking the demo trigger delivers a reminder email listing exactly the currently unticked items and the correct days left.
- [ ] The email's link opens that application's dashboard without logging in.
- [ ] After Mark as submitted, no further daily reminders are sent.

### Submit and follow-up
- **Mark as submitted** records the submission date.
- Then asks: "Remind you to follow up?" Yes/No; if yes, choose when (default 2 weeks after submission).
- Sends one follow-up reminder email at that time, then nothing more.
- [ ] Marking submitted changes the status to Submitted and shows the follow-up choice.
- [ ] Choosing yes schedules exactly one follow-up email at the chosen time; choosing no schedules none.

### My applications
- Lists all applications for the confirmed email with status, deadline, days left, progress.
- The dashboard has a left sidebar with a compact **New scan** box and the same list (current one highlighted), so a new application can be started without leaving the page. *(Added at learner request after slice 5.)*

### Deleting an application
- **Delete this application…** at the bottom of the dashboard, with an inline confirmation. Removes the application and its checklist and stops all its emails. Once linked to an email, only that signed-in user can delete it. *(Added at learner request after slice 5, for scans made in error.)*
- [ ] Deleting removes the application, its checklist items, and its page (404).
- [ ] A linked application can't be deleted without the owner's session.
- [ ] Every scanned and saved application appears with correct status and progress.

## States and Boundaries

- **First use / nothing saved:** landing page with the paste box; My applications shows an empty state pointing back to the paste box.
- **Before email is confirmed:** the dashboard is usable in this browser; reminders are off until the magic link is clicked.
- **No clear deadline** (rolling / until filled): dashboard says "No fixed deadline found"; checklist still appears, no countdown or best-by dates.
- **Deadline already passed:** no plan is built; a clear "Deadline passed — this application is closed" message. Not saved for reminders.
- **Not an application:** "This doesn't look like an application or opportunity," with a prompt to paste a different one. No dashboard created.
- **Blocked link:** warning + paste-text fallback (see Input and scanning).
- **Very tight deadline** (timeline can't fit comfortably): *assumption to confirm:* still build the plan, compress best-by dates, and show a "Tight deadline" warning.
- **All items ticked but not submitted:** reminders continue with a nudge to submit.
- **Persistence:** applications, checklist state, email, submission and follow-up choice persist across sessions.

## Product Decisions

- **Paste link or text, with a blocked-link fallback:** most users don't want the hassle of copying and pasting, but many sites block reading, so the fallback must be clear.
- **Magic link instead of accounts:** no signup friction; avoids the privacy gap of plain email-only.
- **Email only for now:** WhatsApp verification could eat the build window.
- **Daily reminders stop on submit**, not on all-ticked.
- **Follow-up is opt-in, one-time, user-chosen timing**, default 2 weeks after submission.
- **Passed deadline → stop, don't plan:** don't make the user wade through a report for something closed.
- **Dark default, light toggle; Linear structure + Charcoal & Oxblood colour + Kariiya hero composition:** chose own palette after the first one's contrast felt weak.
- **Importance colours separate from the accent:** so Critical stands out instead of blending with buttons.
- **Demo trigger for the next-day reminder:** the video is 3 minutes; reminders unfold over days.

## What We're Building
Landing page with paste box · staged scan progress · link fetching with blocked fallback · AI extraction with importance ranking, guidance, and best-by dates · application dashboard with tickable checklist · magic-link email confirmation · daily reminder emails + demo trigger · mark submitted + one opt-in follow-up email · My applications list · dark/light theme.

## Deferred From the POC
- **WhatsApp reminders:** needs Meta Business verification or Twilio sandbox opt-in.
- **Full accounts** (passwords, profiles, settings): magic link covers identity for now.
- **Editing extracted details / adding custom checklist items:** useful, but not needed to prove the loop.
- **Reminder time-of-day preferences:** one daily send time is enough for now.

## Possible Later Enhancements
- Weekly digest across all applications.
- Smarter follow-up timing per application type.
- Browser extension / share-sheet capture so users never copy-paste.
- Document vault: reuse a transcript or CV across applications.

## Non-Goals
- **Writing essays for the user:** guidance only; the applicant's own voice is the point.
- **Searching for or recommending opportunities:** ApplyReady plans applications you've already found.
- **Submitting applications on the user's behalf.**

## Open Questions
- Tight-deadline behaviour (compress best-by dates + "Tight deadline" warning): accepted with the PRD as the working assumption; revisit only if it misbehaves in the build.
