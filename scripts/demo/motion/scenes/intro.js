// Opening (voice 0:00–0:17.8): applications pile up, get missed, why they were missed, then the logo.
import { a, mark, wordmark, cross } from "../kit.js";

const APPS = [
  // [type, title, days left, appears at (synced to "job" / "scholarship" / "applications")]
  ["Scholarship", "Masters Scholarship 2027", 21, 4.0],
  ["Job", "Junior Frontend Engineer", 9, 3.2],
  ["Admission", "PhD Programme, Fall Intake", 34, 4.6],
  ["Grant", "Early-Career Research Grant", 5, 5.0],
];
const BLOCKERS = [["Essays", 10.4], ["Documents", 11.6], ["Planning", 12.7]];

export default function intro() {
  const cards = APPS.map(([type, title, days, at], i) => `
    <div class="card" style="width:700px;padding:24px 28px;margin-left:${i % 2 ? 60 : 0}px;
      ${a(["rise", at, 0.8], ["edge", 6.6 + i * 0.12, 1.1, "ease-in-out"], ["dim", 9.5 + i * 0.12, 0.8])}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="chip" style="font-size:20px;padding:6px 14px">${type}</span>
        <span style="position:relative;font-size:26px;font-weight:600;min-width:150px;text-align:right">
          <span class="accent" style="${a(["fadeOut", 8.6 + i * 0.14, 0.25])}">${days} days</span>
          <span style="position:absolute;right:0;color:var(--crit);${a(["pop", 8.75 + i * 0.14, 0.45])}">Missed</span>
        </span>
      </div>
      <div style="font-size:32px;font-weight:600;margin-top:14px">${title}</div>
    </div>`).join("");

  const blockers = BLOCKERS.map(([label, at]) => `
    <div style="display:flex;align-items:center;gap:26px;${a(["slideInR", at, 0.6])}">
      ${cross(64, at)}
      <span style="position:relative;font-size:64px;font-weight:600;letter-spacing:-0.03em">${label}
        <i style="position:absolute;left:-6px;right:-6px;top:52%;height:5px;border-radius:3px;background:var(--crit);transform-origin:left;${a(["strike", at + 0.45, 0.45])}"></i>
      </span>
    </div>`).join("");

  return `
  <div class="stage opaque">
    <div class="glow" style="${a(["fadeIn", 0, 1.4])}"></div>
    <div class="abs center-x kicker" style="top:120px;font-size:34px;${a(["rise", 0.15, 0.9], ["fadeOut", 13.8])}">As a graduate…</div>

    <div class="abs" style="left:230px;top:250px;display:flex;flex-direction:column;gap:22px;${a(["fromCenter", 9.9, 0.9, "cubic-bezier(.65,0,.35,1)"], ["zoomAway", 13.9, 0.7])}">${cards}</div>

    <div class="abs" style="left:1130px;top:330px;display:flex;flex-direction:column;gap:46px;${a(["zoomAway", 13.95, 0.7])}">${blockers}</div>

    <div class="abs center-x" style="top:330px">

      <div class="kicker" style="font-size:34px;${a(["rise", 14.05, 0.7])}">So I built</div>
      <div style="display:inline-flex;align-items:center;gap:30px;margin-top:34px">
        ${mark(132, 14.75, true)}
        ${wordmark(132, 15.45)}
      </div>
      <div class="h2" style="margin-top:44px;font-weight:500;${a(["rise", 16.4, 0.8])}">Every application, <span class="accent">shortlist-ready.</span></div>
    </div>
  </div>`;
}
