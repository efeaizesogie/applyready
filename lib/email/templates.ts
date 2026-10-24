import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Application } from "@/lib/db";
import { isOverdue, sortForDisplay } from "@/lib/plan";

// Email clients ignore CSS variables and most stylesheets, so the light palette is inlined.
const C = { bg: "#F1EDE5", card: "#FBF9F5", line: "#DDD6CA", ink: "#212227", muted: "#6A655E", accent: "#601E1D", crit: "#D03B3B" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(preheader: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:${C.bg};font-family:-apple-system,'Segoe UI',Inter,Arial,sans-serif;color:${C.ink}">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 16px;font-weight:600;font-size:16px">Apply<span style="color:${C.accent}">Ready</span></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:12px;padding:24px">${body}</td></tr>
<tr><td style="padding:16px 4px;font-size:12px;color:${C.muted}">You're getting this because you turned on reminders for this application in ApplyReady.</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${C.accent};color:#F1EDE5;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:6px">${esc(label)}</a>`;
}

const daysText = (n: number) => (n === 0 ? "due today" : `${n} ${n === 1 ? "day" : "days"} left`);

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
  );

  const text = [
    app.title,
    remaining.length ? `${remaining.length} left${daysLeft !== null ? ` · ${daysText(daysLeft)}` : ""}` : "Everything is ticked — time to submit.",
    "",
    ...remaining.map((i) => `[ ] ${i.title}${i.bestBy ? ` (best by ${i.bestBy}${isOverdue(i.bestBy, i.done, today) ? ", overdue" : ""})` : ""}`),
    "",
    `Continue where you stopped: ${link}`,
  ].join("\n");

  return { subject, html, text };
}
