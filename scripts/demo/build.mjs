// Builds the demo video from scripts/demo/timeline.mjs. Not part of the app.
//   node scripts/demo/build.mjs              → render changed parts/graphics, join → demo-out/applyready-demo.mp4
//   node scripts/demo/build.mjs --list       → print every part and graphic with its time and narration
//   node scripts/demo/build.mjs --force <id> → re-render one part or graphic even if unchanged
// Parts and graphics are cached in demo-out/build/ by a hash of their settings, so editing one
// entry re-renders only that entry before the final join.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import ffmpeg from "ffmpeg-static";
import { PARTS, GRAPHICS, VOICE } from "./timeline.mjs";
import { renderScene, sceneHash, closeBrowser } from "./motion/render.mjs";

const D = "demo-out";
const OUT = `${D}/build`;
const FPS = 30;
const CUT = 0.04; // a "hard cut" is a one-frame dissolve so every join can use xfade
const VERSION = 1; // bump to invalidate every cached part after changing how parts are rendered

// The learner's 1920x1032 screen recordings are cropped to 16:9 without the browser's tab/address bar.
const SHAPE = {
  app: "scale=1920:1080:flags=lanczos",
  inbox: "crop=1515:852:0:88,scale=1920:1080:flags=lanczos",
  inboxApp: "crop=1678:944:121:88,scale=1920:1080:flags=lanczos",
};
// Third-party marks and personal details blurred out of the inbox recordings (fractions of the frame).
const BLUR = {
  gmail: [0.03, 0.0, 0.09, 0.075], // Gmail logo
  banner: [0.175, 0.14, 0.825, 0.105], // Google account banner above the inbox
  avatar: [0.172, 0.29, 0.046, 0.075], // profile photo beside a message
};

const total = PARTS.at(-1).at + PARTS.at(-1).len;
const lenOf = (i) => (PARTS[i + 1] ? PARTS[i + 1].at : total) - PARTS[i].at;
const fadeOf = (i) => (PARTS[i + 1] ? PARTS[i].fade ?? CUT : 0);
const hash = (x) => createHash("sha1").update(JSON.stringify(x)).digest("hex").slice(0, 12);
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;

function run(args) {
  return new Promise((res, rej) => {
    const p = spawn(ffmpeg, ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`))));
  });
}

// Eased (smoothstep) interpolation between camera keyframes, as an ffmpeg expression of time T.
function track(keys, i) {
  let expr = String(keys.at(-1)[i]);
  for (let k = keys.length - 2; k >= 0; k--) {
    const [t0, t1, v0, v1] = [keys[k][0], keys[k + 1][0], keys[k][i], keys[k + 1][i]];
    const p = `min(1,max(0,(T-${t0})/${t1 - t0}))`;
    expr = `if(lt(T,${t1}),${v0}+(${v1 - v0})*${p}*${p}*(3-2*${p}),${expr})`;
  }
  return expr;
}
function camera(cam) {
  if (!cam || cam.every(([, z]) => z === 1)) return "null";
  const T = `(on/${FPS})`;
  const [z, cx, cy] = [1, 2, 3].map((i) => track(cam, i).replaceAll("T", T));
  // Zoom on a 2x upscale so slow moves don't step pixel by pixel.
  return (
    `scale=3840:2160:flags=lanczos,zoompan=d=1:fps=${FPS}:s=1920x1080:z='${z}'` +
    `:x='max(0,min(iw-iw/zoom,(${cx})*iw-iw/zoom/2))':y='max(0,min(ih-ih/zoom,(${cy})*ih-ih/zoom/2))'`
  );
}
function blurs(list = []) {
  return list.map((b, n) => {
    const [name, from = 0, to = 1e9] = Array.isArray(b) ? b : [b];
    const [x, y, w, h] = BLUR[name].map((v, k) => Math.round(v * (k % 2 ? 1080 : 1920)));
    return `split[m${n}][b${n}];[b${n}]crop=${w}:${h}:${x}:${y},boxblur=luma_radius=24:luma_power=4:chroma_radius=10:chroma_power=4[bb${n}];[m${n}][bb${n}]overlay=${x}:${y}:enable='between(t,${from},${to})'`;
  }).join(",");
}

async function renderPart(p, i, out) {
  const len = lenOf(i), dur = len + fadeOf(i);
  if (p.scene) return renderScene(p.scene, p.params, dur, out);
  const [file, a, b] = p.clip;
  const hold = p.holdStart ?? 0;
  const speed = p.holdEnd ? 1 : (b - a) / (len - hold);
  const chain = [
    `[0:v]trim=start=${a}:end=${b},setpts=(PTS-STARTPTS)/${speed}`,
    SHAPE[p.shape ?? "app"], `fps=${FPS}`, blurs(p.blur),
    `tpad=start_mode=clone:start_duration=${hold}:stop_mode=clone:stop_duration=${dur + 1}`,
    `trim=duration=${dur}`, camera(p.cam), "format=yuv420p",
  ].filter(Boolean).join(",");
  await run(["-i", `${D}/${file}`, "-filter_complex", chain, "-t", dur.toFixed(3), "-an",
    "-c:v", "libx264", "-preset", "medium", "-crf", "12", out]);
}

if (process.argv.includes("--list")) {
  console.log("PARTS");
  PARTS.forEach((p, i) => console.log(`  ${p.id.padEnd(16)} ${fmt(p.at)}–${fmt(p.at + lenOf(i))}  ${p.says ?? ""}`));
  console.log("GRAPHICS");
  GRAPHICS.forEach((g) => console.log(`  ${g.id.padEnd(16)} ${fmt(g.at)}–${fmt(g.at + g.dur)}  ${g.scene}`));
  process.exit(0);
}

const force = process.argv.includes("--force") ? process.argv[process.argv.indexOf("--force") + 1] : null;
mkdirSync(OUT, { recursive: true });

const jobs = [
  ...PARTS.map((p, i) => ({
    id: p.id, out: `${OUT}/${p.id}.mp4`,
    key: p.scene ? sceneHash(p.scene, { ...p.params, len: lenOf(i), fade: fadeOf(i) }) : hash({ VERSION, p, len: lenOf(i), fade: fadeOf(i), SHAPE, BLUR }),
    render: (out) => renderPart(p, i, out),
  })),
  ...GRAPHICS.map((g) => ({
    id: g.id, out: `${OUT}/${g.id}.mov`,
    key: sceneHash(g.scene, { ...g.params, dur: g.dur }),
    render: (out) => renderScene(g.scene, { ...g.params, dur: g.dur }, g.dur, out),
  })),
];
const stale = jobs.filter((j) => j.id === force || !existsSync(`${j.out}.hash`) || readFileSync(`${j.out}.hash`, "utf8") !== j.key);
console.log(stale.length ? `rendering ${stale.length}: ${stale.map((j) => j.id).join(", ")}` : "all parts cached");

// Three at a time: ffmpeg encodes and Chromium frame captures overlap well.
const queue = [...stale];
await Promise.all([0, 1, 2].map(async () => {
  for (let j; (j = queue.shift()); ) {
    await j.render(j.out);
    writeFileSync(`${j.out}.hash`, j.key);
    console.log(`  ✓ ${j.id}`);
  }
}));
await closeBrowser();

// Join: each part starts exactly at its `at` (the crossfade borrows the previous part's tail),
// graphics are laid on top, then upscaled to 1440p so YouTube serves its higher-quality stream.
const inputs = [...PARTS.map((p) => ["-i", `${OUT}/${p.id}.mp4`]), ...GRAPHICS.map((g) => ["-i", `${OUT}/${g.id}.mov`])].flat();
const f = [];
let v = "[0:v]";
PARTS.slice(1).forEach((p, j) => {
  f.push(`${v}[${j + 1}:v]xfade=transition=fade:duration=${fadeOf(j)}:offset=${p.at}[x${j + 1}]`);
  v = `[x${j + 1}]`;
});
GRAPHICS.forEach((g, k) => {
  const n = PARTS.length + k;
  f.push(`[${n}:v]setpts=PTS-STARTPTS+${g.at}/TB[g${k}]`, `${v}[g${k}]overlay=eof_action=pass:format=auto[o${k}]`);
  v = `[o${k}]`;
});
f.push(`${v}scale=2560:1440:flags=lanczos,format=yuv420p[vout]`);
f.push(`[${PARTS.length + GRAPHICS.length}:a]aresample=48000,apad[aout]`);

const out = `${D}/applyready-demo.mp4`;
console.log("joining…");
await run([...inputs, "-i", VOICE, "-filter_complex", f.join(";"), "-map", "[vout]", "-map", "[aout]",
  "-t", total.toFixed(3), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-profile:v", "high",
  "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", out]);
console.log(`wrote ${out} (${fmt(total)}, 2560x1440)`);
process.exit(0); // Playwright's driver can keep the event loop alive after the browser closes
