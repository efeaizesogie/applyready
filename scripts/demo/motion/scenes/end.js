// Closing (voice 2:49.6–end): the payoff line, then the logo and the two links judges need.
import { a, mark, wordmark, check } from "../kit.js";

export default function end({ dur = 7 } = {}) {
  return `
  <div class="stage opaque">
    <div class="glow"></div>
    <div class="abs center-x" style="top:440px;${a(["sinkOut", 2.35, 0.5])}">
      <div style="display:inline-flex;align-items:center;gap:28px">
        ${check(84, 1.1)}
        <span class="h1" style="${a(["rise", 0.25, 0.8])}">This time, I didn't miss the deadline.</span>
      </div>
    </div>
    <div class="abs center-x" style="top:300px">
      <div style="display:inline-flex;align-items:center;gap:30px">${mark(120, 2.6, true)}${wordmark(120, 3.0)}</div>
      <div class="h2" style="margin-top:40px;font-weight:500;${a(["rise", 2.75, 0.8])}">With ApplyReady, <span class="accent">you won't either.</span></div>
      <div style="margin-top:64px;font-size:40px;font-weight:500;${a(["rise", 3.7, 0.8])}">applyready-gamma.vercel.app</div>
      <div class="mono muted" style="margin-top:16px;font-size:30px;${a(["rise", 4.1, 0.8])}">github.com/efeaizesogie/applyready</div>
    </div>
    <div class="stage" style="background:#000;${a(["blackIn", dur - 0.8, 0.8, "ease-in"])}"></div>
  </div>`;
}
