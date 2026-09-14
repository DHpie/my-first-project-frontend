/**
 * Truncate text at word boundary up to maxLength characters.
 * If truncated, appends "..." (total length ≤ maxLength + 3).
 */
export function truncateExcerpt(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  if (lastSpaceIndex === -1) {
    // No word boundary found, hard cut at maxLength
    return truncated + "...";
  }

  return truncated.slice(0, lastSpaceIndex) + "...";
}

/**
 * Format like count to human-readable format.
 * - Negative → "0"
 * - 0 → "0"
 * - 1–999 → exact number (e.g., "328")
 * - ≥ 1000 → "Xk" format (e.g., "1.2k"), using Math.round(count / 100) / 10
 */
export function formatLikeCount(count: number): string {
  if (count <= 0) {
    return "0";
  }

  if (count < 1000) {
    return String(count);
  }

  const formatted = Math.round(count / 100) / 10;
  return `${formatted}k`;
}
