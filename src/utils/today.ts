/**
 * The actual current date, and the "rolling demo data" helpers.
 *
 * The sample records were authored around 5 Oct 2026 (the old fixed "today"). So the demo stays live on any
 * day, authored dates are moved forward by the number of days between that anchor and the real current date
 * (`shiftIso`): every relationship in the data (registered before joining, issued before accepted ...) is kept,
 * and "today" always sits in the middle of the sample data.
 */

export const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DAY_MS = 86_400_000;
const utcMs = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

export const addDaysIso = (iso: string, days: number): string => new Date(utcMs(iso) + days * DAY_MS).toISOString().slice(0, 10);

/** Date the sample data was authored around. */
export const DEMO_ANCHOR_DATE = '2026-10-05';

/** Days between the authoring date and the real current date (never negative). */
export const DEMO_SHIFT_DAYS = Math.max(0, Math.round((utcMs(todayIso()) - utcMs(DEMO_ANCHOR_DATE)) / DAY_MS));

/** Moves a YYYY-MM-DD (or longer timestamp, suffix kept) authored date forward onto the current timeline. */
export const shiftIso = (value: string): string => {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})(.*)$/s);
  return m ? `${addDaysIso(m[1], DEMO_SHIFT_DAYS)}${m[2]}` : value;
};
