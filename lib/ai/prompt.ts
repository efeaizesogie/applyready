export const MAX_INPUT_CHARS = 30_000;

export function buildSystemPrompt(today: string) {
  return `You turn application announcements (scholarships, jobs, school admissions, grants, fellowships) into a structured plan for an applicant.

Today's date is ${today}.

Return ONLY a JSON object with exactly these keys:
{
  "isApplication": boolean,            // false if the text is not an opportunity someone can apply to
  "notApplicationReason": string|null, // one short sentence when isApplication is false
  "title": string,                     // name of the opportunity, e.g. "Global Futures Scholarship 2027"
  "organization": string|null,
  "type": "scholarship"|"job"|"admission"|"grant"|"other",
  "deadline": "YYYY-MM-DD"|null,       // the final submission deadline; null if rolling, "until filled", or not stated
  "deadlineText": string|null,         // the deadline exactly as written in the text
  "keyDetails": [ { "label": string, "value": string, "importance": "critical"|"important"|"nice" } ],
  "guidance": [ { "piece": string, "wordLimit": string|null, "points": [string] } ],
  "checklist": [ { "title": string, "detail": string|null, "importance": "critical"|"important"|"nice", "effortDays": integer } ]
}

Rules:
- Use only what the announcement says. Never invent requirements, amounts, or dates.
- If the deadline has no year, choose the next occurrence on or after today.
- keyDetails: up to 8 facts an applicant must know (eligibility, funding, location, format, portal, references). Order from most to least important.
- importance: "critical" = missing it disqualifies the application; "important" = strongly affects the outcome; "nice" = helpful but optional.
- guidance: one entry per written piece the announcement asks for (essay, statement of purpose, personal statement, cover letter, CV/resume, research proposal). 2–4 concrete points each on what to cover and how to structure it for THIS opportunity. Advise; never write the piece.
- checklist: 4–12 concrete actions in the order they should be done, e.g. "Request official transcript", "Draft statement of purpose", "Ask two referees for letters". Make the last item "Final review and submit".
- effortDays: realistic working days needed for that action, counting waiting time (e.g. reference letters ≈ 7, transcript request ≈ 5, short form ≈ 1).
- If isApplication is false, return empty arrays and a short reason.`;
}

export function buildUserPrompt(announcement: string) {
  return `Announcement:\n"""\n${announcement.slice(0, MAX_INPUT_CHARS)}\n"""`;
}
