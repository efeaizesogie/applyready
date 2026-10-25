// "Next, I'm adding…" (voice 2:36.9–2:49.6): three upcoming features, then who it's for.
import { a } from "../kit.js";

const ICONS = {
  chat: `<path d="M5 6h22a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H14l-6 5v-5H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"/><path d="M9 13h14M9 17h9"/>`,
  calendar: `<rect x="3" y="6" width="26" height="23" rx="3"/><path d="M3 12h26M10 3v6M22 3v6M9 18h4M15 18h4M21 18h2M9 23h4M15 23h4"/>`,
  puzzle: `<path d="M6 10h6a3 3 0 1 1 6 0h6v6a3 3 0 1 1 0 6v6h-6a3 3 0 1 0-6 0H6v-6a3 3 0 1 0 0-6z"/>`,
};
const FEATURES = [["chat", "WhatsApp reminders", 1.75], ["calendar", "Weekly digest", 4.7], ["puzzle", "Browser extension", 6.1]];

export default function roadmap() {
  const cards = FEATURES.map(([icon, title, at]) => `
    <div class="card" style="width:470px;padding:40px 36px;${a(["rise", at, 0.8])}">
      <svg width="64" height="64" viewBox="0 0 32 32" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        class="draw" style="--len:120;${a(["fadeIn", at, 0.3])}">${ICONS[icon].replace(/<(path|rect)/g, `<$1 style="--len:120;${a(["draw", at + 0.15, 1.1]).replace(/"/g, "")}"`)}</svg>
      <div style="font-size:38px;font-weight:600;margin-top:26px;letter-spacing:-0.02em">${title}</div>
    </div>`).join("");

  return `
  <div class="stage opaque">
    <div class="glow"></div>
    <div class="abs center-x" style="top:200px;${a(["liftUp", 7.6, 0.9])}">
      <span class="chip acc" style="font-size:30px;padding:10px 26px;${a(["pop", 0.1, 0.6])}">Next</span>
    </div>
    <div class="abs" style="left:0;right:0;top:330px;display:flex;justify-content:center;gap:40px;${a(["liftUp", 7.6, 0.9])}">${cards}</div>
    <div class="abs center-x h2" style="top:760px;font-weight:500">
      <div style="${a(["rise", 8.4, 0.9])}">The first point of contact for</div>
      <div style="${a(["rise", 9.4, 0.9])}"><span class="accent">every graduate</span> on this hunt.</div>
    </div>
  </div>`;
}
