import tls from "node:tls";
import { URL } from "node:url";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_LINKS_PER_CRAWL = 20;

export type UptimeResult = {
  status: "up" | "down";
  httpCode: number | null;
  latencyMs: number | null;
};

/** Pings a URL once and reports whether it responded with a non-error status. */
export async function checkUptime(url: string): Promise<UptimeResult> {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "WebsiteWatchdogBot/1.0" },
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - started;
    return {
      status: res.status < 500 ? "up" : "down",
      httpCode: res.status,
      latencyMs,
    };
  } catch {
    return { status: "down", httpCode: null, latencyMs: Date.now() - started };
  }
}

/**
 * Opens a raw TLS connection to read the server's certificate expiry.
 * Returns null for plain-http sites or if the handshake fails.
 */
export async function checkSslExpiry(
  siteUrl: string
): Promise<Date | null> {
  let hostname: string;
  try {
    const parsed = new URL(siteUrl);
    if (parsed.protocol !== "https:") return null;
    hostname = parsed.hostname;
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: FETCH_TIMEOUT_MS },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (cert && cert.valid_to) {
          resolve(new Date(cert.valid_to));
        } else {
          resolve(null);
        }
      }
    );
    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

export type BrokenLink = { sourceUrl: string; brokenUrl: string; statusCode: number | null };

/**
 * Shallow crawl: fetches the homepage, extracts same-origin links via a
 * simple regex (no HTML-parsing dependency), and checks up to
 * MAX_LINKS_PER_CRAWL of them. Good enough to catch obviously broken
 * internal links — not a full-site crawler.
 */
export async function crawlBrokenLinks(siteUrl: string): Promise<BrokenLink[]> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return [];
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(siteUrl, {
      signal: controller.signal,
      headers: { "user-agent": "WebsiteWatchdogBot/1.0" },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  const hrefPattern = /href=["']([^"'#]+)["']/gi;
  const seen = new Set<string>();
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(html)) && links.length < MAX_LINKS_PER_CRAWL) {
    let resolved: string;
    try {
      resolved = new URL(match[1], origin).toString();
    } catch {
      continue;
    }
    if (!resolved.startsWith(origin)) continue; // internal links only
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    links.push(resolved);
  }

  const broken: BrokenLink[] = [];
  for (const link of links) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(link, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "WebsiteWatchdogBot/1.0" },
      });
      clearTimeout(timeout);
      if (res.status >= 400) {
        broken.push({ sourceUrl: siteUrl, brokenUrl: link, statusCode: res.status });
      }
    } catch {
      broken.push({ sourceUrl: siteUrl, brokenUrl: link, statusCode: null });
    }
  }
  return broken;
}
