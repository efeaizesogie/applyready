// A count that flips as it's spoken ("11 tasks → 9 left"), with an optional line underneath.
import { a, esc } from "../kit.js";

const POS = { br: "right:64px;bottom:64px", tr: "right:64px;top:64px", bl: "left:64px;bottom:64px" };

export default function count({ pos = "br", from, to, swapAt, sub, subAt, dur }) {
  return `
  <div class="glass" style="${POS[pos]};min-width:420px;padding:30px 40px 34px;${a(["rise", 0, 0.6], ["sinkOut", dur - 0.45, 0.4])}">
    <div class="title">Today's reminder</div>
    <div style="position:relative;height:120px;overflow:hidden">
      <div class="abs" style="font-size:100px;font-weight:700;letter-spacing:-0.04em;line-height:120px;color:var(--muted);${a(["slideUpOut", swapAt, 0.5])}">${esc(from)}</div>
      <div class="abs accent" style="font-size:100px;font-weight:700;letter-spacing:-0.04em;line-height:120px;${a(["slideUpIn", swapAt + 0.08, 0.6])}">${esc(to)}</div>
    </div>
    ${sub ? `<div style="font-size:32px;font-weight:500;margin-top:10px;${a(["rise", subAt, 0.6])}">${esc(sub)}</div>` : ""}
  </div>`;
}
