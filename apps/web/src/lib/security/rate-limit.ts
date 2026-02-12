import type { NextRequest } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const GLOBAL_KEY = "__gk_rate_limit_buckets__";

function buckets(): Map<string, Bucket> {
  const root = globalThis as unknown as { [GLOBAL_KEY]?: Map<string, Bucket> };
  if (!root[GLOBAL_KEY]) {
    root[GLOBAL_KEY] = new Map<string, Bucket>();
  }
  return root[GLOBAL_KEY] as Map<string, Bucket>;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return "local";
  }

  const first = forwarded.split(",")[0]?.trim();
  return first || "local";
}

export function checkRateLimit(params: {
  request: NextRequest;
  userKey: string;
  routeKey: string;
  max: number;
  windowMs: number;
}) {
  const { request, userKey, routeKey, max, windowMs } = params;
  const ip = clientIp(request);
  const now = Date.now();
  const store = buckets();
  const key = `${routeKey}:${userKey}:${ip}`;

  const current = store.get(key);
  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (current.count >= max) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, remaining: Math.max(0, max - current.count), resetAt: current.resetAt };
}
