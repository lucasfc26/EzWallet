/** DB-facing helpers to keep the wire format an ISO "yyyy-MM-dd" string, matching frontend/src/types/index.ts's ISODate. */

export function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toISODate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addRecurrence(date: Date, recurrence: 'weekly' | 'monthly' | 'yearly', times: number): Date {
  const next = new Date(date.getTime());
  if (recurrence === 'weekly') next.setUTCDate(next.getUTCDate() + 7 * times);
  else if (recurrence === 'monthly') next.setUTCMonth(next.getUTCMonth() + times);
  else next.setUTCFullYear(next.getUTCFullYear() + times);
  return next;
}

/** 0 on the wire means Sempre. We still materialize a finite horizon. */
export function expandRecurrenceCount(
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly',
  count?: number,
): { stored: number; expand: number } {
  if (recurrence === 'none') return { stored: 1, expand: 1 };
  const requested = count ?? 1;
  if (requested <= 0) {
    const expand = recurrence === 'weekly' ? 104 : recurrence === 'yearly' ? 10 : 36;
    return { stored: 0, expand };
  }
  const bounded = Math.min(60, requested);
  return { stored: bounded, expand: bounded };
}
