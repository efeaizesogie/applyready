// Records the demo video's app clips against the live site, in phases that pause for the
// inbox clips you record yourself. Not part of the app.
//
//   DEMO_EMAIL=you@example.com node --env-file=.env.local scripts/demo/record.mjs 1   (then 2, then 3)
//
// Output: demo-out/clip-<phase>.webm (gitignored). Session state between phases lives in demo-out/ too.
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync, renameSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.DEMO_BASE || "https://applyready-gamma.vercel.app";
const EMAIL = process.env.DEMO_EMAIL;
const PHASE = Number(process.argv[2]);
const OUT = "demo-out";
const STATE = join(OUT, "session.json");
const META = join(OUT, "meta.json");
const SIZE = { width: 1920, height: 1080 };

if (!EMAIL || ![1, 2, 3].includes(PHASE)) {
  console.error("Usage: DEMO_EMAIL=… node --env-file=.env.local scripts/demo/record.mjs <1|2|3>");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const meta = existsSync(META) ? JSON.parse(readFileSync(META, "utf8")) : {};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Headless video has no mouse pointer, so draw one that follows Playwright's mouse.
const CURSOR = `
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText = "position:fixed;left:0;top:0;width:22px;height:22px;margin:-4px 0 0 -4px;z-index:2147483647;pointer-events:none;transition:transform .08s";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l15 9-7 1.5L8.5 20z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { c.style.transform = "scale(.8)"; }, true);
    addEventListener("mouseup", () => { c.style.transform = ""; }, true);
  });`;

async function start(useSession) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: OUT, size: SIZE },
    ...(useSession ? { storageState: STATE } : {}),
  });
  await context.addInitScript(CURSOR);
  const page = await context.newPage();
  await page.mouse.move(960, 540);
  return { browser, context, page };
}

async function moveTo(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 30 });
  await wait(250);
}
async function click(page, locator) {
  await moveTo(page, locator);
  await page.mouse.down();
  await wait(90);
  await page.mouse.up();
}
async function scrollBy(page, dy, ms = 1400) {
  const steps = Math.max(1, Math.round(ms / 30));
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await wait(30);
  }
}

async function finish({ browser, context, page }, name) {
  await context.storageState({ path: STATE });
  const video = page.video();
  await context.close();
  await browser.close();
  const src = await video.path();
  renameSync(src, join(OUT, name));
  writeFileSync(META, JSON.stringify(meta, null, 2));
  console.log(`saved ${join(OUT, name)}`);
}

async function tickUnticked(page, count) {
  for (let i = 0; i < count; i++) {
    const item = page.locator('li button[aria-pressed="false"]').first();
    await click(page, item);
    await wait(700);
  }
}

async function sendReminderNow(page) {
  const btn = page.getByRole("button", { name: "Send today's reminder now" });
  await click(page, btn);
  await page.getByText(/Sent — check your inbox/).waitFor({ timeout: 30_000 });
  await wait(2500);
}

if (PHASE === 1) {
  for (const f of readdirSync(OUT)) rmSync(join(OUT, f), { force: true });
  const s = await start(false);
  const { page } = s;

  await page.goto(BASE);
  await wait(2500);
  const box = page.locator("main textarea");
  await click(page, box);
  await box.fill(readFileSync("scripts/fixtures/scholarship.txt", "utf8"));
  await wait(1500);
  await click(page, page.getByRole("button", { name: "Scan →" }));
  await page.waitForURL(/\/a\/[0-9a-f-]{36}/, { timeout: 120_000 });
  meta.appId = page.url().match(/\/a\/([0-9a-f-]{36})/)[1];
  await page.getByRole("heading", { name: "Checklist" }).waitFor();
  await wait(2500);

  // Tour: checklist and guidance on the left, key details on the right.
  await scrollBy(page, 700, 2500);
  await wait(1500);
  await scrollBy(page, 700, 2500);
  await wait(1500);
  await scrollBy(page, -1400, 1800);
  await wait(800);

  // Turn reminders on.
  const email = page.locator('input[type="email"]');
  await click(page, email);
  await email.pressSequentially(EMAIL, { delay: 45 });
  await wait(500);
  await click(page, page.getByRole("button", { name: "Send magic link" }));
  await page.getByText("Check your email.").waitFor({ timeout: 30_000 });
  await wait(2500);

  // Same confirmation the emailed link performs, opened in this browser so the recording stays continuous.
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
  if (error) throw error;
  await page.goto(`${BASE}/auth/confirm?token_hash=${data.properties.hashed_token}&claim=${meta.appId}`);
  await page.getByText("Email confirmed").waitFor({ timeout: 30_000 });
  await wait(2500);

  await tickUnticked(page, 2);
  await wait(800);
  await sendReminderNow(page);
  await finish(s, "clip-1.webm");
  console.log(`\nPAUSE: reminder #1 sent for ${BASE}/a/${meta.appId}`);
}

if (PHASE === 2) {
  // Two more fictional applications under the same email, so "My applications" shows a real list.
  const { data: owner } = await admin.from("applications").select("user_id").eq("id", meta.appId).single();
  if (!meta.extras) {
    meta.extras = [];
    for (const f of ["job", "rolling"]) {
      const r = await fetch(`${BASE}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: readFileSync(`scripts/fixtures/${f}.txt`, "utf8") }),
      }).then((x) => x.json());
      await admin.from("applications").update({ user_id: owner.user_id, email: EMAIL.toLowerCase(), reminders_enabled: true }).eq("id", r.id);
      meta.extras.push(r.id);
    }
  }

  const s = await start(true);
  const { page } = s;
  await page.goto(`${BASE}/applications`);
  await page.getByRole("heading", { name: "My applications" }).waitFor();
  await wait(3500);
  await click(page, page.getByRole("link", { name: /Northbridge/ }).first());
  await page.getByRole("heading", { name: "Checklist" }).waitFor();
  await wait(2000);
  await tickUnticked(page, 3);
  await wait(800);
  await sendReminderNow(page);
  await finish(s, "clip-2.webm");
  console.log(`\nPAUSE: reminder #2 sent`);
}

if (PHASE === 3) {
  const s = await start(true);
  const { page } = s;
  await page.goto(`${BASE}/a/${meta.appId}`);
  await page.getByRole("heading", { name: "Checklist" }).waitFor();
  await wait(1500);
  await click(page, page.getByRole("button", { name: "Mark as submitted" }));
  await wait(1800);
  await click(page, page.getByRole("button", { name: "Confirm submitted" }));
  await page.getByRole("heading", { name: "Submitted" }).waitFor({ timeout: 30_000 });
  await wait(3500);
  await page.goto(`${BASE}/applications`);
  await page.getByRole("heading", { name: "My applications" }).waitFor();
  await wait(3500);
  await finish(s, "clip-3.webm");
  rmSync(STATE, { force: true }); // the saved session is a login cookie; don't keep it around
}
