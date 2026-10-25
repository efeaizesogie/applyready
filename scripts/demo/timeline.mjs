// The demo video's edit decision list. Times are seconds on the voiceover clock (demo-out/voice.mp3).
// PARTS are the footage, back to back; each runs from its `at` to the next part's `at`.
// GRAPHICS are motion overlays laid on top at absolute times.
// Edit an entry here and `node scripts/demo/build.mjs` re-renders only what changed.

export const VOICE = "demo-out/voice.mp3";

// Camera targets: [zoom, centre x, centre y] as fractions of the frame.
const FULL = [1, 0.5, 0.5];
const PANEL = [1.4, 0.72, 0.3]; // Daily reminders / Submit card, top of the right column
const LIST = [1.6, 0.5, 0.3125]; // the "My applications" list
const EMAIL = [1.3, 0.6, 0.56]; // body of a reminder email in Gmail
const cam = (...keys) => keys.map(([t, [z, x, y]]) => [t, z, x, y]);

// Rows of the "My applications" list on screen at the LIST zoom (pixels).
const ROW = (n) => ({ x: 364, w: 1192, y: 304 + (n - 1) * 139, h: 151 });

export const PARTS = [
  { id: "intro", at: 0, scene: "intro", fade: 0.5,
    says: "As a graduate, I've struggled… So I built ApplyReady." },
  { id: "landing", at: 17.3, clip: ["clip-1.webm", 8.6, 11.85],
    says: "Here I paste a scholarship announcement and click Scan." },
  { id: "scanning", at: 21.2, clip: ["clip-1.webm", 11.85, 23.0], fade: 0.4,
    cam: cam([0, FULL], [1.5, [1.25, 0.5, 0.55]]),
    says: "The progress bar shows the AI reading every requirement…" },
  { id: "plan-ranked", at: 28.0, clip: ["clip-1.webm", 23.0, 25.4], holdEnd: true,
    says: "My plan opens at its own private link. Every task is ranked by colour…" },
  { id: "plan-dates", at: 38.8, clip: ["clip-1.webm", 25.3, 25.4], holdEnd: true,
    says: "The dates are spaced out, so slow tasks like referees start early." },
  { id: "guidance", at: 44.2, clip: ["clip-1.webm", 25.4, 33.0],
    cam: cam([0, FULL], [5.0, FULL], [6.0, [1.25, 0.64, 0.55]]),
    says: "Below there's writing guidance for my statement and CV…" },
  { id: "shortlist", at: 50.4, clip: ["clip-1.webm", 33.0, 38.4],
    cam: cam([0, [1.25, 0.64, 0.55]], [1.2, FULL]),
    says: "It doesn't write for me, but… worthy of being shortlisted." },
  { id: "key-details", at: 57.4, clip: ["clip-1.webm", 38.4, 40.9], fade: 0.5,
    cam: cam([0, FULL], [1.6, FULL], [2.6, [1.45, 0.72, 0.7]]),
    says: "Then there are the key details: deadline, eligibility and where to submit." },
  { id: "chatbot", at: 63.3, scene: "chatbot", fade: 0.5,
    says: "Here's what a chatbot can't do… ApplyReady keeps going." },
  { id: "magic-link", at: 71.9, clip: ["clip-1.webm", 41.0, 46.3],
    cam: cam([0, PANEL]),
    says: "I enter my email and click Send magic link." },
  { id: "check-email", at: 74.66, clip: ["clip-1.webm", 46.3, 52.9],
    cam: cam([0, PANEL]),
    says: "I confirm it in my inbox…" },
  { id: "confirmed", at: 78.2, clip: ["clip-1.webm", 53.4, 56.6],
    cam: cam([0, PANEL]),
    says: "…and I'm in. No password, no sign-up form, just daily reminders." },
  { id: "tick-two", at: 83.4, clip: ["clip-1.webm", 56.6, 59.2],
    cam: cam([0, PANEL], [0.7, FULL]),
    says: "I get to work and tick off two items." },
  { id: "send-now", at: 86.6, clip: ["clip-1.webm", 59.2, 61.95],
    cam: cam([0, FULL], [0.8, FULL], [2.4, PANEL]),
    says: "Every morning, ApplyReady emails me what's still left. For now I click Send…" },
  { id: "sent", at: 91.2, clip: ["clip-1.webm", 61.95, 67.6], fade: 0.4,
    cam: cam([0, PANEL]),
    says: "…and it's on its way." },
  { id: "inbox", at: 96.3, clip: ["user-clip-1.mp4", 0.0, 2.0], shape: "inbox", blur: ["gmail", "banner"],
    says: "There it is in my inbox," },
  { id: "email-9-left", at: 97.9, clip: ["user-clip-1.mp4", 14.0, 15.9], shape: "inbox", blur: ["gmail"],
    cam: cam([0, FULL], [1.0, EMAIL]),
    says: "11 tasks, now 9 left. The two I finished aren't there." },
  { id: "continue", at: 102.2, clip: ["user-clip-1.mp4", 15.9, 17.3], shape: "inbox", blur: ["gmail"],
    cam: cam([0, EMAIL], [0.8, FULL]),
    says: "I click Continue…" },
  { id: "back-on-plan", at: 103.3, clip: ["user-clip-1.mp4", 18.5, 20.4], shape: "inboxApp", fade: 0.4,
    says: "…and land right back on my plan." },
  { id: "my-applications", at: 106.0, clip: ["clip-2.webm", 2.3, 7.2], fade: 0.4,
    cam: cam([0, FULL], [1.5, LIST]),
    says: "My applications shows everything tied to my email…" },
  { id: "another-day", at: 115.0, clip: ["clip-2.webm", 8.8, 12.6],
    says: "Another day I come back and tick off three more." },
  { id: "tick-three", at: 118.2, clip: ["clip-2.webm", 12.6, 15.9],
    says: "My transcripts, my referees and my passport." },
  { id: "already-knows", at: 120.95, clip: ["clip-2.webm", 15.9, 18.75], holdStart: 5.2,
    cam: cam([0, FULL], [1.3, FULL], [2.3, [1.5, 0.47, 0.3]], [6.2, [1.5, 0.47, 0.3]], [7.6, PANEL]),
    says: "I don't have to remember where I stopped… I send the reminder again." },
  { id: "sent-again", at: 129.0, clip: ["clip-2.webm", 18.75, 25.1], fade: 0.4,
    cam: cam([0, PANEL], [2.8, PANEL], [4.0, FULL]),
    says: "The scholarship I would have forgotten is finally coming together." },
  { id: "email-6-left", at: 134.6, clip: ["user-clip-2.mp4", 4.6, 9.0], shape: "inbox", fade: 0.4,
    blur: ["gmail", ["banner", 0, 1.1], ["avatar", 1.1]],
    cam: cam([0, FULL], [1.0, FULL], [2.0, EMAIL]),
    says: "Now the email says six left. Every reminder gets shorter as I work." },
  { id: "mark-submitted", at: 140.0, clip: ["clip-3.webm", 2.0, 5.0],
    cam: cam([0, FULL], [1.2, [1.35, 0.72, 0.42]]),
    says: "When I'm done, I click Mark as submitted…" },
  { id: "confirm-submit", at: 141.8, clip: ["clip-3.webm", 5.0, 8.1],
    cam: cam([0, [1.35, 0.72, 0.42]], [0.6, [1.35, 0.72, 0.45]]),
    says: "…and confirm." },
  { id: "saving", at: 143.1, clip: ["clip-3.webm", 8.1, 10.3],
    cam: cam([0, [1.35, 0.72, 0.45]], [1.2, [1.45, 0.72, 0.3]]) },
  { id: "submitted", at: 144.3, clip: ["clip-3.webm", 10.3, 14.6], fade: 0.4,
    cam: cam([0, [1.45, 0.72, 0.3]]),
    says: "The daily reminders stop, and ApplyReady schedules one follow-up for later." },
  { id: "list-submitted", at: 151.2, clip: ["clip-3.webm", 15.3, 19.5], fade: 0.5,
    cam: cam([0, FULL], [1.3, LIST]),
    says: "Back on My applications, the scholarship now shows submitted." },
  { id: "roadmap", at: 156.9, scene: "roadmap", fade: 0.5,
    says: "Next, I'm adding WhatsApp reminders, a weekly digest and a browser extension…" },
  { id: "end", at: 169.6, scene: "end", len: 7.0, params: { dur: 7.0 },
    says: "This time I didn't miss the deadline. With ApplyReady, you won't either." },
];

export const GRAPHICS = [
  { id: "g-ranked", at: 31.0, dur: 7.6, scene: "callout", params: { title: "Ranked by importance", items: [
    { text: "Critical", at: 2.4, kind: "crit" }, { text: "Important", at: 3.1, kind: "imp" },
    { text: "Nice-to-have", at: 4.2, kind: "nice" }, { text: "Best-by date on every task", at: 6.1, kind: "acc" }] } },
  { id: "g-dates", at: 38.9, dur: 5.2, scene: "pace", params: { highlightAt: 3.1, captionAt: 3.7 } },
  { id: "g-guidance", at: 45.2, dur: 5.4, scene: "callout", params: { title: "Writing guidance", items: [
    { text: "Statement", at: 1.3 }, { text: "CV", at: 2.3 },
    { text: "Structure", at: 3.3, kind: "acc" }, { text: "Word limits", at: 4.1, kind: "acc" }] } },
  { id: "g-shortlist", at: 50.5, dur: 6.8, scene: "callout", params: { lines: [
    { text: "It doesn't write for me.", at: 0.15, size: 38 },
    { text: "Worthy of being shortlisted.", at: 3.9, size: 62, accent: true }] } },
  { id: "g-key-details", at: 59.6, dur: 3.5, scene: "callout", params: { title: "Key details", items: [
    { text: "Deadline", at: 0.3 }, { text: "Eligibility", at: 1.0 }, { text: "Where to submit", at: 2.2 }] } },
  { id: "g-no-password", at: 78.5, dur: 4.7, scene: "callout", params: { items: [
    { text: "No password", at: 0.3 }, { text: "No sign-up form", at: 1.2 },
    { text: "Just daily reminders", at: 2.4, kind: "acc" }] } },
  { id: "g-9-left", at: 97.9, dur: 4.2, scene: "count", params: {
    from: "11 tasks", to: "9 left", swapAt: 1.3, sub: "The two I finished aren't there.", subAt: 2.3 } },
  { id: "g-three-apps", at: 109.9, dur: 5.0, scene: "rows", params: { boxes: [
    { ...ROW(3), at: 0.3, label: "Scholarship" }, { ...ROW(2), at: 1.4, label: "Job" }, { ...ROW(1), at: 2.3, label: "Fellowship" }] } },
  { id: "g-ticked", at: 118.0, dur: 4.8, scene: "callout", params: { title: "Ticked off", items: [
    { text: "Transcripts", at: 0.4, kind: "check" }, { text: "Referees", at: 1.5, kind: "check" },
    { text: "Passport", at: 3.1, kind: "check" }] } },
  { id: "g-6-left", at: 134.8, dur: 5.1, scene: "count", params: {
    from: "9 left", to: "6 left", swapAt: 0.9, sub: "Every reminder gets shorter.", subAt: 2.1 } },
  { id: "g-stopped", at: 144.2, dur: 6.8, scene: "callout", params: { items: [
    { text: "Daily reminders stop", at: 0.3, kind: "check" }, { text: "One follow-up, later", at: 3.4, kind: "acc" }] } },
  { id: "g-submitted-row", at: 154.9, dur: 2.0, scene: "rows", params: { boxes: [
    { ...ROW(3), at: 0.3, label: "Submitted" }] } },
];
