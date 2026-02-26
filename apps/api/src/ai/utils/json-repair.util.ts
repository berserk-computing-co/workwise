/**
 * Utilities for salvaging truncated JSON from LLM responses.
 *
 * When a structured-output response hits max_tokens, the JSON is cut mid-stream.
 * These helpers attempt to close open structures so partial results can still be parsed.
 */

/**
 * Attempt to repair truncated JSON that wraps a `{"results":[...]}` structure.
 *
 * Strategy: find the last complete object in the array, discard everything after
 * it, and close the array + outer object.
 *
 * Returns the repaired string if it produces valid JSON, otherwise returns the
 * original input unchanged.
 */
export function repairTruncatedResultsJson(text: string): {
  repaired: string;
  success: boolean;
} {
  // Find the last complete object boundary — prefer after a comma separator
  const lastCommaObj = text.lastIndexOf("},");
  const lastObj = text.lastIndexOf("}");

  const cutAt =
    lastCommaObj !== -1
      ? lastCommaObj + 1
      : lastObj !== -1
        ? lastObj + 1
        : -1;

  if (cutAt === -1) {
    return { repaired: text, success: false };
  }

  const repaired = text.slice(0, cutAt) + "]}";

  try {
    JSON.parse(repaired);
    return { repaired, success: true };
  } catch {
    return { repaired: text, success: false };
  }
}
