/**
 * Formats an ISO 8601 UTC date string into a user-friendly localized format.
 */
export function formatUtcDateTime(
  isoDateStr: string,
  options: { includeTime?: boolean; includeSeconds?: boolean } = { includeTime: true },
): string {
  try {
    const d = new Date(isoDateStr);
    if (Number.isNaN(d.getTime())) return isoDateStr;

    const datePart = d.toISOString().slice(0, 10);
    if (!options.includeTime) return datePart;

    const timePart = options.includeSeconds
      ? d.toISOString().slice(11, 19)
      : d.toISOString().slice(11, 16);

    return `${datePart} ${timePart} UTC`;
  } catch {
    return isoDateStr;
  }
}

/**
 * Calculates duration in human-readable hours and minutes between two ISO date strings.
 */
export function formatDuration(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffMs = end - start;

    if (diffMs <= 0) return '0 hrs';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0 && minutes > 0) return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min`;
    if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${minutes} min`;
  } catch {
    return '';
  }
}

/**
 * Returns a friendly label for booking status codes.
 */
export function getBookingStatusLabel(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'pending':
      return 'Awaiting Approval';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}
