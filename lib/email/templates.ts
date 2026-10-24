import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Application } from "@/lib/db";
import { isOverdue, sortForDisplay } from "@/lib/plan";

// Email clients ignore CSS variables and most stylesheets, so the light palette is inlined.
const C = { bg: "#F1EDE5", card: "#FBF9F5", line: "#DDD6CA", ink: "#212227", muted: "#6A655E", accent: "#601E1D", crit: "#D03B3B" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The logo mark rebuilt in plain HTML: Gmail and Outlook block SVG, and a hosted image wouldn't load
// from localhost. A ✓ in an oxblood rounded tile renders everywhere with nothing to download.
function logo() {
  return `<table cellpadding="0" cellspacing="0" role="presentation"><tr>
<td width="26" height="26" align="center" valign="middle" style="width:26px;height:26px;background:${C.accent};border-radius:7px;color:${C.bg};font-size:15px;font-weight:700;line-height:26px;font-family:Arial,sans-serif">&#10003;</td>
<td style="padding-left:8px;font-weight:600;font-size:16px;color:${C.ink}">Apply<span style="color:${C.accent}">Ready</span></td>
</tr></table>`;
}

function layout(preheader: string, body: string, footer = "You're getting this because you turned on reminders for this application in ApplyReady.") {
  return `<!doctype html><html><body style="margin:0;background:${C.bg};font-family:-apple-system,'Segoe UI',Inter,Arial,sans-serif;color:${C.ink}">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 16px">${logo()}</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:12px;padding:24px">${body}</td></tr>
<tr><td style="padding:16px 4px;font-size:12px;color:${C.muted}">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${C.accent};color:#F1EDE5;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:6px">${esc(label)}</a>`;
}

export const unsubscribeUrl = (appUrl: string, id: string) => `${appUrl}/api/applications/${id}/unsubscribe`;

function reminderFooter(appUrl: string, id: string) {
  return `You're getting this because you turned on reminders for this application in ApplyReady. <a href="${esc(unsubscribeUrl(appUrl, id))}" style="color:${C.muted}">Stop these reminders</a>`;
}

const daysText = (n: number) => (n === 0 ? "due today" : `${n} ${n === 1 ? "day" : "days"} left`);

export function magicLinkEmail(link: string) {
  // Plain, specific wording and the full link in text: "sign in" + a lone button is the classic phishing
  // shape that spam filters score against.
  const subject = "Confirm your email for ApplyReady reminders";
  const html = layout(
    "One click to start your daily application reminders.",
    `<h1 style="margin:0 0 8px;font-size:20px;line-height:1.3">Confirm your email</h1>
<p style="margin:0 0 20px;font-size:14px;color:${C.muted}">You asked ApplyReady to send you daily reminders about your applications. Confirm this address to save your applications under it and turn reminders on. The link works once and expires in an hour.</p>
${button(link, "Confirm my email")}
<p style="margin:20px 0 0;font-size:12px;color:${C.muted}">Or paste this link into your browser:<br><span style="word-break:break-all;color:${C.ink}">${esc(link)}</span></p>`,
    "If you didn't ask for this, you can ignore it — nothing happens unless the link is clicked.",
  );
  const text = `Confirm your email for ApplyReady reminders

You asked ApplyReady to send you daily reminders about your applications. Open this link to confirm (works once, expires in an hour):
${link}

If you didn't ask for this, ignore this email.`;
  return { subject, html, text };
}

export function followUpEmail(app: Application, appUrl: string) {
  const link = `${appUrl}/a/${app.id}`;
  const submitted = app.submittedAt ? format(parseISO(app.submittedAt), "MMM d") : "a while ago";
  const who = app.organization ?? "the organisers";
  const subject = `Time to follow up · ${app.title}`;
  const html = layout(
    `No reply yet? A short follow-up to ${who} helps.`,
    `<div style="font-size:12px;color:${C.muted};text-transform:uppercase;letter-spacing:.06em">Follow-up reminder</div>
<h1 style="margin:6px 0 8px;font-size:20px;line-height:1.3">${esc(app.title)}</h1>
<p style="margin:0 0 12px;font-size:14px;color:${C.muted}">You submitted this on <b style="color:${C.ink}">${submitted}</b>. If you haven't heard back, now is a good time to send ${esc(who)} a short, polite follow-up.</p>
<ul style="margin:0 0 20px;padding-left:18px;font-size:14px;color:${C.muted}">
<li>Reference the exact role or scholarship name and your submission date.</li>
<li>Restate in one line why you're a strong fit.</li>
<li>Ask whether they need anything else from you.</li></ul>
${button(link, "Open the application")}`,
    reminderFooter(appUrl, app.id),
  );
  const text = `${app.title}\nYou submitted this on ${submitted}. If you haven't heard back, send ${who} a short follow-up: reference the name and date, restate your fit in one line, and ask if they need anything else.\n\n${link}\n\nStop these reminders: ${unsubscribeUrl(appUrl, app.id)}`;
  return { subject, html, text };
}

export function reminderEmail(app: Application, today: string, appUrl: string) {
  const link = `${appUrl}/a/${app.id}`;
  const daysLeft = app.deadline ? differenceInCalendarDays(parseISO(app.deadline), parseISO(today)) : null;
  const remaining = sortForDisplay(app.items.filter((i) => !i.done));
  const overdue = remaining.filter((i) => isOverdue(i.bestBy, i.done, today)).length;

  const subject = `${app.title} · ${daysLeft === null ? `${remaining.length} things left` : daysText(daysLeft)}`;

  const intro =
    remaining.length === 0
      ? "Everything on your checklist is ticked. The only step left is to submit — then mark it submitted in ApplyReady."
      : `You have <b>${remaining.length}</b> ${remaining.length === 1 ? "thing" : "things"} left${overdue ? `, <b style="color:${C.crit}">${overdue} overdue</b>` : ""}${daysLeft !== null ? ` and <b>${daysText(daysLeft)}</b>` : ""}.`;

  const rows = remaining
    .map((i) => {
      const late = isOverdue(i.bestBy, i.done, today);
      const when = i.bestBy ? `${late ? "Overdue — was " : ""}best by ${format(parseISO(i.bestBy), "MMM d")}` : "";
      return `<tr><td style="padding:10px 0;border-top:1px solid ${C.line};vertical-align:top;width:20px;color:${C.muted}">&#9744;</td>
<td style="padding:10px 0;border-top:1px solid ${C.line}"><div style="font-size:14px;font-weight:600">${esc(i.title)}</div>
${when ? `<div style="font-size:12px;color:${late ? C.crit : C.muted}">${when}</div>` : ""}</td></tr>`;
    })
    .join("");

  const html = layout(
    `${remaining.length} left on ${app.title}`,
    `<div style="font-size:12px;color:${C.muted};text-transform:uppercase;letter-spacing:.06em">Today's reminder</div>
<h1 style="margin:6px 0 8px;font-size:20px;line-height:1.3">${esc(app.title)}</h1>
<p style="margin:0 0 16px;font-size:14px;color:${C.muted}">${intro}</p>
${rows ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">${rows}</table>` : ""}
${button(link, "Continue where you stopped")}`,
    reminderFooter(appUrl, app.id),
  );

  const text = [
    app.title,
    remaining.length ? `${remaining.length} left${daysLeft !== null ? ` · ${daysText(daysLeft)}` : ""}` : "Everything is ticked — time to submit.",
    "",
    ...remaining.map((i) => `[ ] ${i.title}${i.bestBy ? ` (best by ${i.bestBy}${isOverdue(i.bestBy, i.done, today) ? ", overdue" : ""})` : ""}`),
    "",
    `Continue where you stopped: ${link}`,
    "",
    `Stop these reminders: ${unsubscribeUrl(appUrl, app.id)}`,
  ].join("\n");

  return { subject, html, text };
}
