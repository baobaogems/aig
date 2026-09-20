// =============================================================================
// fetch-deliverable.ts — turn a public URL into the text the arbiter will judge.
//
// Fetching a user-supplied URL from the server is a server-side request forgery primitive:
// the submitter chooses the destination, and the server has network positions the submitter
// does not — cloud metadata endpoints, internal services, the database's own host.
//
// So the address is checked, not the hostname, and it is checked AGAIN after every redirect.
// A hostname that resolves to a public IP on the first lookup can resolve to 169.254.169.254
// on the second, and a 302 to an internal host is the same attack wearing a hat.
//
// The text that comes back is still untrusted input. It goes through the same
// <untrusted_data> fencing as pasted text — the injection fixture scores 4/100 precisely
// because nothing downstream treats deliverable content as instructions.
// =============================================================================

import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_000_000; // 1 MB of text is far beyond any bounty deliverable
const MAX_REDIRECTS = 3;

export class DeliverableFetchError extends Error {}

/**
 * Blocked ranges: loopback, link-local (AWS/GCP metadata lives at 169.254.169.254),
 * and the three private IPv4 blocks, plus their IPv6 equivalents.
 */
function isBlockedIp(ip: string): boolean {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fe80") || v6.startsWith("fc") || v6.startsWith("fd")) return true;
    // IPv4-mapped IPv6 must be judged as the IPv4 address it carries. Node normalises
    // ::ffff:10.0.0.1 to ::ffff:a00:1 — the hex form — so matching only the dotted-quad
    // spelling let 10.0.0.1 straight through. Both spellings are handled here.
    const mapped = extractMappedIpv4(v6);
    if (mapped) return isBlockedIp(mapped);
    return false;
  }

  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 127 || a === 0 || a === 10) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true; // multicast and reserved
  return false;
}

/**
 * Pull the IPv4 address out of an IPv4-mapped IPv6 address, in either spelling:
 *   ::ffff:10.0.0.1   (dotted)   → "10.0.0.1"
 *   ::ffff:a00:1      (hex)      → "10.0.0.1"
 * Returns null when the address is not IPv4-mapped.
 */
function extractMappedIpv4(v6: string): string | null {
  const idx = v6.lastIndexOf("ffff:");
  if (idx === -1) return null;
  const tail = v6.slice(idx + 5);

  if (/^\d+\.\d+\.\d+\.\d+$/.test(tail)) return tail;

  const groups = tail.split(":").filter(Boolean);
  if (groups.length !== 2) return null;
  const nums = groups.map((g) => Number.parseInt(g, 16));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 0xffff)) return null;
  const [hi, lo] = nums;
  return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff].join(".");
}

/** Resolve the host and refuse anything pointing inside the network. */
async function assertPublicHost(urlStr: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    throw new DeliverableFetchError("link không hợp lệ");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new DeliverableFetchError("chỉ nhận link http hoặc https");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true }).catch(() => {
        throw new DeliverableFetchError(`không phân giải được tên miền ${host}`);
      })).map((a) => a.address);

  if (addresses.length === 0) throw new DeliverableFetchError(`không phân giải được ${host}`);
  // Every resolved address must be public: one bad entry is enough for an attacker.
  for (const ip of addresses) {
    if (isBlockedIp(ip)) {
      throw new DeliverableFetchError("link trỏ vào địa chỉ nội bộ — bị từ chối");
    }
  }
}

/** Strip tags, scripts and styles. Not a parser — we only need the words. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    // Opening tags leave a space where the newline already is; without this every line of
    // extracted text starts with one, which then shows up in evidence quotes.
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface FetchedDeliverable {
  text: string;
  contentType: string;
  finalUrl: string;
}

/**
 * Fetch a public URL and return its text. Follows redirects manually so each hop can be
 * re-checked — `redirect: "follow"` would hand the whole chain to undici unchecked.
 */
export async function fetchDeliverable(urlStr: string): Promise<FetchedDeliverable> {
  let current = urlStr;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "AIG-Arbiter/1.0 (+deliverable fetch)" },
      });
    } catch (err) {
      throw new DeliverableFetchError(
        controller.signal.aborted ? "tải link quá 10 giây, đã dừng" : `không tải được link: ${(err as Error).message}`,
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) throw new DeliverableFetchError("link chuyển hướng nhưng không có đích");
      current = new URL(next, current).toString();
      continue; // and the loop re-checks the new address before touching it
    }

    if (!res.ok) throw new DeliverableFetchError(`link trả về lỗi ${res.status}`);

    const contentType = res.headers.get("content-type") ?? "";
    const buf = await readCapped(res);
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const text = /html/i.test(contentType) ? htmlToText(raw) : raw.trim();

    if (text.length < 10) {
      // A JS-only page renders to nothing here. Judging that would be judging a blank page.
      throw new DeliverableFetchError(
        "không đọc được nội dung từ link (trang có thể cần JavaScript) — hãy dán thẳng nội dung",
      );
    }
    return { text, contentType, finalUrl: current };
  }

  throw new DeliverableFetchError(`link chuyển hướng quá ${MAX_REDIRECTS} lần`);
}

/** Read at most MAX_BYTES, so a hostile server cannot stream forever. */
async function readCapped(res: Response): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > MAX_BYTES) {
      chunks.push(value.subarray(0, value.length - (total - MAX_BYTES)));
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(Math.min(total, MAX_BYTES));
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}
