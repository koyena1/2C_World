import { addDays } from '../../utils/trends';
import { todayIso } from '../../utils/today';

export type RangePreset = 'today' | 'last7' | 'last30' | 'custom';

export interface DateRange {
  /** Inclusive ISO dates (YYYY-MM-DD). */
  from: string;
  to: string;
}

/** Options offered in the picker. 'today' is only the initial state, so it is not listed. */
export const RANGE_PRESETS: Array<{ id: Exclude<RangePreset, 'today'>; label: string }> = [
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
];

/** Earliest date the picker accepts. */
export const RANGE_MIN_DATE = '2020-01-01';
export { todayIso };

export const presetRange = (preset: Exclude<RangePreset, 'custom'>, today: string = todayIso()): DateRange => {
  if (preset === 'today') return { from: today, to: today };
  return preset === 'last7' ? { from: addDays(today, -6), to: today } : { from: addDays(today, -29), to: today };
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const isRealDate = (iso: string) => {
  if (!ISO.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00`);
  return !Number.isNaN(d.getTime()) && addDays(iso, 0) === iso;
};

/** Returns an error message, or null when the custom range is acceptable. */
export const validateRange = ({ from, to }: DateRange): string | null => {
  if (!from || !to) return 'Select both a From and a To date.';
  if (!isRealDate(from) || !isRealDate(to)) return 'Enter valid dates.';
  if (from < RANGE_MIN_DATE || to < RANGE_MIN_DATE) return 'Dates cannot be before 1 Jan 2020.';
  const max = todayIso();
  if (from > max || to > max) return 'Dates cannot be in the future.';
  if (from > to) return 'From Date must be on or before To Date.';
  return null;
};

export const formatShort = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Human label for a range, e.g. "Today", "Last 7 Days" or "1 Oct 2026 – 4 Oct 2026". */
export const rangeLabel = (preset: RangePreset, range: DateRange) =>
  preset === 'custom' ? (range.from === range.to ? formatShort(range.from) : `${formatShort(range.from)} – ${formatShort(range.to)}`) : preset === 'today' ? 'Today' : RANGE_PRESETS.find((p) => p.id === preset)?.label ?? '';
