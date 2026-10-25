// "Here's what a chatbot can't do…" (voice 1:03.3–1:11.9): a chat window closes and goes quiet;
// ApplyReady's reminders keep arriving.
import { a, mark } from "../kit.js";

const REMINDERS = [["Mon", "9 left", 6.7], ["Tue", "7 left", 7.05], ["Wed", "6 left", 7.4]];

export default function chatbot() {
  const bubble = (side, html, at) => `
    <div style="align-self:${side === "me" ? "flex-end" : "flex-start"};max-width:420px;padding:16px 20px;border-radius:18px;font-size:24px;line-height:1.4;
      background:${side === "me" ? "var(--raised)" : "transparent"};border:1px solid var(--line);${a(["riseSm", at, 0.5])}">${html}</div>`;

  const reminders = REMINDERS.map(([day, left, at]) => `
    <div style="display:flex;align-items:center;gap:20px;padding:20px 24px;width:560px;border-radius:16px;
      background:#f1ede5;color:#212227;box-shadow:0 20px 60px rgba(0,0,0,.4);${a(["slideInR", at, 0.7])}">
      ${mark(48, at + 0.15, true)}
      <div style="flex:1">
        <div style="font-size:18px;color:#6a655e;text-transform:uppercase;letter-spacing:.08em">${day} · 8:00 · Today's reminder</div>
        <div style="font-size:26px;font-weight:600;margin-top:4px">Northbridge Scholarship · <span style="color:#601e1d">${left}</span></div>
      </div>
    </div>`).join("");

  return `
  <div class="stage opaque">
    <div class="glow" style="opacity:.7"></div>
    <div class="abs center-x h2" style="top:120px;${a(["rise", 0.1, 0.8])}">Here's what a chatbot <span class="accent">can't</span> do.</div>

    <div class="abs" style="left:250px;top:300px;width:600px">
      <div class="card" style="height:430px;padding:0;overflow:hidden;${a(["rise", 0.4, 0.8], ["closeWin", 4.95, 0.8])}">
        <div style="display:flex;gap:9px;padding:18px 22px;border-bottom:1px solid var(--line)">
          <i style="width:13px;height:13px;border-radius:50%;background:#4a4b53"></i><i style="width:13px;height:13px;border-radius:50%;background:#4a4b53"></i><i style="width:13px;height:13px;border-radius:50%;background:#4a4b53"></i>
          <span class="muted" style="margin-left:14px;font-size:20px">AI chat</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;padding:26px">
          ${bubble("me", "Help me plan this scholarship application.", 0.8)}
          ${bubble("ai", "Sure! Start with your transcripts, then your referees…", 1.5)}
        </div>
      </div>
      <div class="abs" style="left:0;right:0;top:170px;text-align:center;font-size:30px;font-weight:600;color:var(--muted);${a(["pop", 5.4, 0.6])}">Tab closed</div>
      <div style="margin-top:30px;font-size:40px;font-weight:600;text-align:center;color:var(--muted);${a(["rise", 2.5, 0.7])}">A chatbot goes quiet.</div>
    </div>

    <div class="abs" style="left:1080px;top:300px;display:flex;flex-direction:column;gap:20px">${reminders}
      <div style="margin-top:12px;font-size:40px;font-weight:600;text-align:center" class="accent"><span style="display:inline-block;${a(["rise", 6.55, 0.7])}">ApplyReady keeps going.</span></div>
    </div>
  </div>`;
}
