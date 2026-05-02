/**
 * Human-readable relative time (e.g. "2 hours ago") using {@link Intl.RelativeTimeFormat}.
 */
export function formatRelativeTime(
  input: Date | string | number,
  now: Date = new Date(),
): string {
  const then = input instanceof Date ? input : new Date(input);
  const diffMs = then.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const absSec = Math.abs(diffSec);
  if (absSec < 60) {
    return rtf.format(diffSec, "second");
  }

  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }

  const diffHour = Math.round(diffMs / 3_600_000);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }

  const diffDay = Math.round(diffMs / 86_400_000);
  if (Math.abs(diffDay) < 7) {
    return rtf.format(diffDay, "day");
  }

  const diffWeek = Math.round(diffMs / (7 * 86_400_000));
  if (Math.abs(diffWeek) < 5) {
    return rtf.format(diffWeek, "week");
  }

  const diffMonth = Math.round(diffMs / (30 * 86_400_000));
  if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, "month");
  }

  const diffYear = Math.round(diffMs / (365 * 86_400_000));
  return rtf.format(diffYear, "year");
}
