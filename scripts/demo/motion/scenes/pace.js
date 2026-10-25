// "The dates are spaced out, so slow tasks like referees start early": a mini timeline to the deadline.
import { a } from "../kit.js";

const STOPS = [["Nov 4", 0.17], ["Nov 8", 0.29], ["Nov 15", 0.48], ["Nov 19", 0.59], ["Nov 27", 0.8], ["Dec 4", 0.97]];

export default function pace({ dur, highlightAt = 3.2, captionAt = 3.9 }) {
  const W = 760;
  const stops = STOPS.map(([label, x], i) => {
    const at = 0.45 + i * 0.22;
    const hot = i === 1;
    return `
      <div class="abs" style="left:${x * W}px;top:0;transform:translateX(-50%);text-align:center">
        <div style="width:22px;height:22px;margin:0 auto;border-radius:50%;background:${hot ? "var(--accent)" : "var(--surface)"};border:3px solid ${hot ? "var(--accent)" : "var(--muted)"};
          ${a(["pop", at, 0.45])}${hot ? `;animation:pop .45s var(--ease) ${at}s both, pulse 1.1s ease-out ${highlightAt}s 2` : ""}"></div>
        <div style="font-size:20px;margin-top:12px;color:${hot ? "var(--ink)" : "var(--muted)"};white-space:nowrap;${a(["riseSm", at + 0.1, 0.4])}">${label}</div>
        ${hot ? `<div class="chip acc" style="position:absolute;left:50%;top:-74px;transform:translateX(-50%);font-size:22px;padding:6px 14px;${a(["pop", highlightAt, 0.5])}">Referees</div>` : ""}
      </div>`;
  }).join("");

  return `
  <div class="glass" style="left:64px;bottom:64px;width:${W + 100}px;padding:30px 50px 34px;${a(["rise", 0, 0.6], ["sinkOut", dur - 0.45, 0.4])}">
    <div class="title">Best-by dates, spaced to the deadline</div>
    <div style="position:relative;height:150px;margin-top:84px">
      <div class="abs" style="left:0;right:0;top:9px;height:4px;border-radius:2px;background:var(--line)"></div>
      <div class="abs" style="left:0;right:0;top:9px;height:4px;border-radius:2px;background:linear-gradient(90deg,var(--muted),var(--accent));transform-origin:left;${a(["grow", 0.3, 1.6, "ease-in-out"])}"></div>
      ${stops}
      <div class="abs" style="right:-30px;top:-46px;font-size:20px;font-weight:600;color:var(--crit);${a(["riseSm", 1.6, 0.4])}">Deadline · Dec 5</div>
    </div>
    <div style="font-size:40px;font-weight:600;letter-spacing:-0.025em;margin-top:-34px;${a(["rise", captionAt, 0.7])}">Slow tasks start <span class="accent">early.</span></div>
  </div>`;
}
