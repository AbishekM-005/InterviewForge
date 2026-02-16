import ENV from "../lib/env.js";

const WINDOW_MS =
  Number.parseInt(ENV.CODE_EXECUTION_RATE_LIMIT_WINDOW_MS, 10) || 60000;
const MAX_REQUESTS =
  Number.parseInt(ENV.CODE_EXECUTION_RATE_LIMIT_MAX, 10) || 30;
const requestBuckets = new Map();
const MAX_BUCKETS = 10000;

const getClientKey = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || "unknown";
};

export function codeExecutionRateLimit(req, res, next) {
  const now = Date.now();
  const key = getClientKey(req);
  const bucket = requestBuckets.get(key);

  if (requestBuckets.size > MAX_BUCKETS) {
    for (const [bucketKey, value] of requestBuckets.entries()) {
      if (now - value.windowStart >= WINDOW_MS) {
        requestBuckets.delete(bucketKey);
      }
    }
  }

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    requestBuckets.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil(
      (bucket.windowStart + WINDOW_MS - now) / 1000
    );

    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: "Too many code execution requests. Please try again shortly.",
    });
  }

  bucket.count += 1;
  return next();
}
