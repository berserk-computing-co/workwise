/**
 * HTTP retry helpers for LLM API calls.
 */

/** Extract `retry-after` header (seconds → ms) from an API error. */
export function parseRetryAfter(error: unknown): number | null {
  if (
    error &&
    typeof error === "object" &&
    "headers" in error &&
    error.headers &&
    typeof error.headers === "object" &&
    "get" in error.headers &&
    typeof error.headers.get === "function"
  ) {
    const val = error.headers.get("retry-after");
    if (val) {
      const secs = Number(val);
      if (!Number.isNaN(secs) && secs > 0) return secs * 1000;
    }
  }
  return null;
}

/** Check whether an error is a 429 rate-limit response. */
export function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status: number }).status === 429;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return msg.startsWith("429 ");
}
