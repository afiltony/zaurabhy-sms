import { NextResponse } from "next/server";
import { DatabaseNotConfiguredError } from "@/lib/prebooking/db";
import { PrebookingError } from "@/lib/prebooking/service";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}

/** Fixed-window, in-memory limiter. Returns true when the caller is over the limit. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const nowMs = Date.now();
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= nowMs) buckets.delete(bucketKey);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= nowMs) {
    buckets.set(key, { count: 1, resetAt: nowMs + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

/** Public origin of the site, for links in emails. */
export function getBaseUrl(headers: Headers): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const host = headers.get("x-forwarded-host") || headers.get("host") || "www.zaurabhya.com";
  const proto =
    headers.get("x-forwarded-proto")?.split(",")[0] ||
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * CSRF guard for the JSON APIs: browsers always send Origin on cross-site
 * POSTs, so a request whose Origin is another site is rejected.
 */
function isCrossSite(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  const host = headers.get("x-forwarded-host") || headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/**
 * Shared front door for the pre-booking JSON APIs: same-origin check, rate
 * limit, JSON parsing, and translation of errors into safe responses.
 */
export async function handleJsonPost(
  request: Request,
  limit: { name: string; max: number; windowMs: number },
  handler: (body: Record<string, unknown>) => Promise<unknown>,
) {
  if (isCrossSite(request.headers)) {
    return NextResponse.json({ error: "Cross-site request rejected" }, { status: 403 });
  }
  if (isRateLimited(`${limit.name}:${getClientIp(request.headers)}`, limit.max, limit.windowMs)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    return NextResponse.json(await handler(body as Record<string, unknown>));
  } catch (err) {
    if (err instanceof PrebookingError) {
      return NextResponse.json(
        { error: err.message, code: err.code, issues: err.issues },
        { status: err.status },
      );
    }
    console.error(`Pre-booking API error (${limit.name}):`, err);
    const unavailable = err instanceof DatabaseNotConfiguredError;
    return NextResponse.json(
      {
        error: unavailable
          ? "Pre-booking is temporarily unavailable. Please contact us to place your order."
          : "Something went wrong on our side. Please try again in a moment.",
      },
      { status: unavailable ? 503 : 500 },
    );
  }
}
