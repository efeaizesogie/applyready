// Renders a motion scene to video by stepping its CSS animations frame by frame in Chromium.
// Opaque scenes → H.264 .mp4; transparent overlays → .mov with alpha (qtrle) for ffmpeg's overlay.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import ffmpeg from "ffmpeg-static";

const HERE = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const OPAQUE = new Set(["intro", "chatbot", "roadmap", "end"]);

// Changes to a scene's file (or the shared kit/styles) change its hash, which triggers a re-render.
export function sceneHash(scene, params) {
  const h = createHash("sha1");
  for (const f of ["base.css", "kit.js", "stage.html", `scenes/${scene}.js`]) h.update(readFileSync(join(HERE, f)));
  h.update(JSON.stringify(params ?? {}));
  return h.digest("hex").slice(0, 12);
}

export const isOpaque = (scene) => OPAQUE.has(scene);

// Module scripts don't load from file://, so the stage is served over a local static server.
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
let browser, server, base;
async function start() {
  browser ??= await chromium.launch();
  if (!server) {
    server = createServer((req, res) => {
      const path = join(HERE, decodeURIComponent(new URL(req.url, "http://x").pathname));
      try {
        res.writeHead(200, { "Content-Type": TYPES[path.slice(path.lastIndexOf("."))] ?? "application/octet-stream" });
        res.end(readFileSync(path));
      } catch {
        res.writeHead(404).end();
      }
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
  }
}
export async function closeBrowser() {
  await browser?.close();
  server?.closeAllConnections(); // idle keep-alive sockets would otherwise hold the process open
  server?.close();
  browser = server = undefined;
}

async function open(scene, params) {
  await start();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const p = Buffer.from(JSON.stringify(params ?? {}), "utf8").toString("base64");
  await page.goto(`${base}/stage.html?scene=${scene}&p=${encodeURIComponent(p)}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 30_000 });
  return page;
}

// Stills at chosen times, for checking a design without rendering the whole scene.
export async function previewScene(scene, params, times, outPrefix) {
  const page = await open(scene, params);
  for (const t of times) {
    await page.evaluate((x) => window.seek(x), t);
    await page.screenshot({ path: `${outPrefix}-${t}.png`, omitBackground: !isOpaque(scene) });
  }
  await page.close();
}

export async function renderScene(scene, params, dur, out) {
  const page = await open(scene, params);

  const opaque = isOpaque(scene);
  const enc = opaque
    ? ["-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p"]
    : ["-c:v", "qtrle", "-pix_fmt", "argb"];
  const ff = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", ...enc, out], {
    stdio: ["pipe", "inherit", "inherit"],
  });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c} for ${scene}`)))));

  const frames = Math.round(dur * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.seek(t), i / FPS);
    const png = await page.screenshot({ type: "png", omitBackground: !opaque });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
  await page.close();
}
