/**
 * Timestamp formatting. Pure: it reads the value it is given and never the
 * clock, so it belongs in the domain next to money formatting.
 */

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** Formats a Unix-epoch millisecond timestamp as a date, e.g. "Sep 8, 2026". */
export function formatDate(timestamp: number): string {
  return dateFormatter.format(timestamp);
}
