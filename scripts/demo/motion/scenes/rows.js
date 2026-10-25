// Outlines rows of the "My applications" list as they're named. Boxes are in screen pixels.
//   { boxes: [{ x, y, w, h, at, label }], dur }
import { a, esc } from "../kit.js";

export default function rows({ boxes, dur }) {
  return boxes.map(({ x, y, w, h, at, label }) => `
    <div class="abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border:3px solid var(--accent);border-radius:14px;
      box-shadow:0 0 0 6px rgba(217,112,107,.18), 0 0 40px rgba(217,112,107,.35);${a(["pop", at, 0.5], ["fadeOut", dur - 0.4, 0.35])}">
      ${label ? `<span class="chip acc" style="position:absolute;right:calc(100% + 22px);top:50%;margin-top:-27px;font-size:26px;background:#2a1f20;${a(["riseSm", at + 0.15, 0.5])}">${esc(label)}</span>` : ""}
    </div>`).join("");
}
