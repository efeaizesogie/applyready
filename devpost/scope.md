---
doc: scope
status: approved
---

# ApplyReady

Paste an application announcement and get a plan that works backward from the deadline, then daily email nudges until every requirement is ticked off.

## The Unique Kernel
ApplyReady doesn't just summarise an announcement. It turns it into a **deadline-driven checklist that chases you**. Every unticked item (essay, statement of purpose, transcript, CV tailoring) becomes a daily reminder with the days remaining and a link back to exactly where you stopped. After you submit, it tells you when a follow-up is due. A chat answer goes quiet once you close it; ApplyReady keeps reminding you until you submit and follow up.

## Who It's For
A recent graduate juggling several applications at once: scholarships (BSc, Masters, PhD), school admissions, jobs, and grants, in any country. They find opportunities, but lose them in execution: essays not drafted in time, documents not gathered, no plan for the weeks before the deadline, and no follow-up after submitting. Today they keep it in their head, in scattered notes, or not at all, and fall back on bulk-applying.

## The Core Loop
1. Find an opportunity → paste the link (or the text if the link is blocked).
2. ApplyReady extracts the key requirements, ranks what matters most, gives essay/cover letter/CV guidance, and builds a checklist paced to the deadline.
3. Each application gets its own dashboard; all applications are visible together.
4. Every day, an email lists what's still unticked and how many days are left, linking straight back to that application.
5. Tick items off → mark submitted → get a follow-up nudge if there's been no reply after a set number of days.

They come back because the reminder brings them back.

## Inspiration & Identity
[Linear](https://linear.app) and [Notion](https://notion.so): clean, minimal, structured, calm. Calm and organised, not a nagging alarm.

## Why This Matters to the Learner
"As a graduate, I have been struggling with being consistent with my job and scholarship applications. Oftentimes I forget and miss out on some because I couldn't put essays together, gather the needed documents and plan the whole application properly." The goal: "each application I send is worthy of being shortlisted," not bulk applications. They want friends with the same problem to use it as a first point of contact.

## What "Working" Looks Like
Paste a real scholarship or job link → a dashboard appears with the ranked key requirements, guidance, and a deadline-paced checklist → tick a couple of items → trigger the reminder (simulated "next day" for the demo) → a real email arrives listing the remaining items and days left → click the link and land back on that application's dashboard.

**The "oh, that's useful" beat:** the email arriving in a real inbox, naming exactly what you haven't done yet, with a link back to it.

## The POC Boundary
- Input: paste a URL (fetch the page) with a clear "this link is blocked, paste the text instead" fallback; paste-text always works.
- AI extraction: key requirements, deadline, required documents, essay/cover letter/CV guidance, importance ranking, checklist.
- A dashboard per application, plus a list of all applications.
- Tickable checklist with progress and days remaining.
- Email reminders listing unticked items + days left + link back; a demo trigger to send the "next day" reminder on demand.
- Mark as submitted → follow-up reminder N days after the deadline if no reply.

## Later
- WhatsApp reminders (needs Meta Business verification or Twilio sandbox opt-in).
- Weekly digest across all applications.
- Smarter follow-up timing per application type.
- Browser extension / share-sheet capture so users never copy-paste.

## Explicitly Cut
- **WhatsApp in this version:** setup and verification could consume the build window; email proves the same loop.
- **Writing the essays for the user:** ApplyReady guides structure, it doesn't ghostwrite. The point is applications worth shortlisting, in the applicant's own voice.
