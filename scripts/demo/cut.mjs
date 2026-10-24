// Assembles the demo video from demo-out/ clips. Not part of the app.
//   node scripts/demo/cut.mjs                      → demo-out/rough-cut.mp4 (silent, for timing a voiceover)
//   node scripts/demo/cut.mjs path/to/voice.mp3    → demo-out/applyready-demo.mp4 (with voiceover)
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const voice = process.argv[2];
const D = "demo-out";
const BG = "0x212227";
const FONT = "C\\:/Windows/Fonts/segoeui.ttf";

// [file, start, end, speed, kind]. "app" clips are 1920x1080; "inbox" clips are 1920x1032 screen
// recordings, cropped left of Gmail's Quick settings panel and centred on the app background.
const SEGMENTS = [
  ["clip-1.webm", 1.0, 9.0, 1, "app"], // landing → paste
  ["clip-1.webm", 9.0, 23.0, 2, "app"], // scan progress, 2×
  ["clip-1.webm", 23.0, 37.0, 1, "app"], // dashboard tour
  ["clip-1.webm", 37.0, 67.6, 1, "app"], // email → confirmed → tick 2 → send now
  ["user-clip-1.mp4", 0.0, 2.5, 1, "inbox"], // inbox list
  ["user-clip-1.mp4", 12.5, 22.0, 1, "inbox"], // reminder (9 left) → Continue → dashboard
  ["clip-2.webm", 1.5, 8.0, 1, "app"], // My applications
  ["clip-2.webm", 8.0, 25.0, 1, "app"], // tick 3 → send again
  ["user-clip-2.mp4", 4.5, 12.0, 1, "inbox"], // new reminder: 6 left
  ["clip-3.webm", 1.5, 19.5, 1, "app"], // submit → follow-up → reminders stop → list
];

const inputs = [];
const filters = [];
SEGMENTS.forEach(([file, start, end, speed, kind], i) => {
  inputs.push("-i", `${D}/${file}`);
  const shape =
    kind === "inbox"
      ? `crop=1546:1032:0:0,scale=-2:1080,pad=1920:1080:(ow-iw)/2:0:color=${BG}`
      : "scale=1920:1080";
  filters.push(
    `[${i}:v]trim=start=${start}:end=${end},setpts=(PTS-STARTPTS)/${speed},${shape},fps=30,format=yuv420p,setsar=1[v${i}]`,
  );
});

// End card: the two links reviewers need, on the app's background colour.
const endIdx = SEGMENTS.length;
inputs.push("-f", "lavfi", "-t", "5", "-i", `color=c=${BG}:s=1920x1080:r=30`);
filters.push(
  `[${endIdx}:v]drawtext=fontfile='${FONT}':text='ApplyReady':fontcolor=0xF3F1EC:fontsize=96:x=(w-tw)/2:y=h/2-150,` +
    `drawtext=fontfile='${FONT}':text='applyready-gamma.vercel.app':fontcolor=0xD9706B:fontsize=44:x=(w-tw)/2:y=h/2+10,` +
    `drawtext=fontfile='${FONT}':text='github.com/efeaizesogie/applyready':fontcolor=0xA9A8B0:fontsize=36:x=(w-tw)/2:y=h/2+80,` +
    `format=yuv420p,setsar=1[v${endIdx}]`,
);

const all = [...SEGMENTS.keys(), endIdx].map((i) => `[v${i}]`).join("");
filters.push(`${all}concat=n=${endIdx + 1}:v=1:a=0[vout]`);

const args = ["-y", "-loglevel", "error", ...inputs];
let out;
if (voice) {
  args.push("-i", voice);
  filters.push(`[${endIdx + 1}:a]aresample=48000,apad[aout]`);
  out = `${D}/applyready-demo.mp4`;
  args.push("-filter_complex", filters.join(";"), "-map", "[vout]", "-map", "[aout]", "-shortest", "-c:a", "aac", "-b:a", "192k");
} else {
  out = `${D}/rough-cut.mp4`;
  args.push("-filter_complex", filters.join(";"), "-map", "[vout]");
}
args.push("-c:v", "libx264", "-preset", "medium", "-crf", "20", "-movflags", "+faststart", out);

const r = spawnSync(ffmpeg, args, { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`wrote ${out}`);
