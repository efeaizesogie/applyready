// Floating callout over a screen recording: optional title, chips and lines, each timed to the voice.
//   { pos: "bl"|"br"|"tl"|"tr", title, items: [{ text, at, kind: crit|imp|nice|ok|acc|check|plain }],
//     lines: [{ text, at, size, accent }], width, dur }
import { a, check, esc } from "../kit.js";

const POS = { bl: "left:64px;bottom:64px", br: "right:64px;bottom:64px", tl: "left:64px;top:64px", tr: "right:64px;top:64px" };

export default function callout({ pos = "bl", title, items = [], lines = [], width, dur }) {
  const chips = items.map(({ text, at, kind = "plain" }) =>
    kind === "check"
      ? `<span class="chip ok" style="${a(["pop", at, 0.55])}">${check(30, at + 0.05)}${esc(text)}</span>`
      : `<span class="chip ${kind}" style="${a(["pop", at, 0.55])}">${["crit", "imp", "nice"].includes(kind) ? '<i class="dot"></i>' : ""}${esc(text)}</span>`,
  ).join("");
  const text = lines.map(({ text, at, size = 44, accent }) =>
    `<div style="font-size:${size}px;font-weight:600;letter-spacing:-0.025em;line-height:1.15;${accent ? "color:var(--accent);" : ""}${a(["rise", at, 0.7])}">${esc(text)}</div>`,
  ).join("");
  const vertical = items.length > 3 || pos.startsWith("t") ? "stack" : "row";
  return `
  <div class="glass" style="${POS[pos]};${width ? `width:${width}px;` : ""}${a(["rise", 0, 0.6], ["sinkOut", dur - 0.45, 0.4])}">
    ${title ? `<div class="title">${esc(title)}</div>` : ""}
    ${text ? `<div style="display:flex;flex-direction:column;gap:10px">${text}</div>` : ""}
    ${chips ? `<div class="${vertical}" style="${text ? "margin-top:20px" : ""}">${chips}</div>` : ""}
  </div>`;
}
