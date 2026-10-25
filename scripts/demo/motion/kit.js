// Helpers shared by every scene. Times are seconds from the scene's start.

// a(["rise", 0.4], ["fadeOut", 6, 0.4]) → an inline `animation:` declaration.
export function a(...specs) {
  const parts = specs.map(([name, at, dur, ease, fill]) => {
    const exit = /Out|Away|dim|closeWin|liftUp/.test(name);
    return `${name} ${dur ?? (exit ? 0.45 : 0.7)}s ${ease ?? "var(--ease)"} ${at}s ${fill ?? (exit ? "forwards" : "both")}`;
  });
  return `animation:${parts.join(",")};`;
}

// The ApplyReady mark (app/icon.svg) with its tick drawn in at `at`.
export function mark(size, at, deep = false) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" class="draw" style="${a(["pop", at, 0.7])}">
    <rect width="32" height="32" rx="8" fill="${deep ? "#601E1D" : "#d9706b"}"/>
    <path d="M9 15.5l4.6 4.6L23.5 10" fill="none" stroke="${deep ? "#F1EDE5" : "#212227"}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="--len:22;${a(["draw", at + 0.35, 0.5])}"/>
    <path d="M9.5 24.5h13" fill="none" stroke="${deep ? "#F1EDE5" : "#212227"}" stroke-opacity=".45" stroke-width="2.2" stroke-linecap="round" style="--len:14;${a(["draw", at + 0.6, 0.4])}"/>
  </svg>`;
}

// Wordmark: "Apply" in ink, "Ready" in accent, as in the app's nav.
export function wordmark(size, at) {
  return `<span style="font-size:${size}px;font-weight:600;letter-spacing:-0.03em;display:inline-block;${a(["slideInL", at, 0.8])}">Apply<span class="accent" style="display:inline-block;${a(["riseSm", at + 0.25, 0.6])}">Ready</span></span>`;
}

export function check(size, at, color = "var(--ok)") {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" class="draw" style="${a(["pop", at, 0.5])}">
    <circle cx="12" cy="12" r="11" fill="none" stroke="${color}" stroke-opacity=".35" stroke-width="1.6"/>
    <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="--len:16;${a(["draw", at + 0.2, 0.4])}"/>
  </svg>`;
}

export function cross(size, at) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" class="draw" style="${a(["pop", at, 0.5])}">
    <circle cx="12" cy="12" r="11" fill="rgba(255,107,107,.1)" stroke="var(--crit)" stroke-opacity=".5" stroke-width="1.6"/>
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" fill="none" stroke="var(--crit)" stroke-width="2.2" stroke-linecap="round" style="--len:10;${a(["draw", at + 0.2, 0.35])}"/>
  </svg>`;
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
