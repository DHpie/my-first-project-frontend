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

/**
 * 格式化消息时间戳为相对/绝对时间。
 * - < 1 分钟 → "Just now"
 * - < 1 小时 → "Xm ago"
 * - < 24 小时 → "Xh ago"
 * - < 7 天 → "Xd ago"
 * - ≥ 7 天 → "MMM D"（如 "Sep 23"）
 */
export function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * 格式化消息气泡内的时间戳（简短格式）。
 * - < 1 天 → "10:32 AM"
 * - ≥ 1 天 → "Sep 23"
 */
export function formatBubbleTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDay < 1) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}
