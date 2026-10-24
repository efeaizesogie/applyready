import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

export type FetchResult = { ok: true; text: string; title: string | null } | { ok: false; reason: string };

const MIN_TEXT = 400;
const MAX_BYTES = 2_000_000;

// The server fetches URLs users paste, so refuse anything that points back into a private network.
function isPrivateAddress(ip: string) {
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  const [a, b] = v4.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

async function assertPublicUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https links are supported");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (addresses.some(isPrivateAddress)) throw new Error("That address isn't publicly reachable");
  return url;
}

export async function fetchAnnouncement(raw: string): Promise<FetchResult> {
  let url: URL;
  try {
    url = await assertPublicUrl(raw);
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  }

  let html: string;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return { ok: false, reason: `The site answered ${res.status}` };
    if (!(res.headers.get("content-type") ?? "").includes("html")) return { ok: false, reason: "That link isn't a web page" };
    html = (await res.text()).slice(0, MAX_BYTES);
  } catch {
    return { ok: false, reason: "The site didn't respond in time" };
  }

  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || null;
  $("script, style, noscript, svg, iframe, nav, footer, header, form, aside").remove();
  const root = $("main").length ? $("main") : $("article").length ? $("article") : $("body");
  // Keep paragraph breaks so the model sees structure, then collapse the rest of the whitespace.
  root.find("p, li, h1, h2, h3, h4, br, div").each((_, el) => {
    $(el).append("\n");
  });
  const text = root
    .text()
    .replace(/[ \t ]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

  if (text.length < MIN_TEXT) return { ok: false, reason: "The page needs a login or loads its content with JavaScript" };
  return { ok: true, text, title };
}
