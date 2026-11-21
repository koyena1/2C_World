/**
 * KPI trend helpers. Pure functions over REAL data: nothing here invents a comparison.
 *
 * A trend compares a metric's value now with its value one period earlier. It can only be
 * built when the earlier value can be reconstructed from dated records (e.g. "candidates
 * registered on or before <date>"). Metrics that are just a snapshot of current state
 * (blockers, pending offers, ...) have no history, so they get no trend at all.
 */

export type TrendPeriod = 'day' | 'week' | 'month';

export const PERIOD_DAYS: Record<TrendPeriod, number> = { day: 1, week: 7, month: 30 };
export const PERIOD_LABEL: Record<TrendPeriod, string> = {
  day: 'vs yesterday',
  week: 'vs last week',
  month: 'vs last month',
};

/** The two values a trend compares, plus how to judge a change. */
export interface TrendInput {
  /** Value now. */
  current: number;
  /** Value one period earlier. */
  previous: number;
  period: TrendPeriod;
  /**
   * true  (default): an increase is an improvement (joined, verified, signed ...).
   * false: a decrease is an improvement (blockers, drop-offs, pending work ...).
   * null : direction has no good/bad meaning, so it is shown neutrally.
   */
  higherIsBetter?: boolean | null;
}

export const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** How many items have a date on or before `asOfIso` (the metric's value on that day). */
export const countAsOf = <T,>(items: T[], dateOf: (item: T) => string | null | undefined, asOfIso: string): number =>
  items.filter((item) => {
    const raw = dateOf(item);
    return Boolean(raw) && (raw as string).slice(0, 10) <= asOfIso;
  }).length;

/**
 * Trend of a cumulative count ("stock") that grows as dated events happen, e.g. total
 * candidates (by registration date). `items` must already be the set the card displays.
 */
export const stockTrend = <T,>(
  items: T[],
  dateOf: (item: T) => string | null | undefined,
  referenceIso: string,
  period: TrendPeriod = 'month',
  higherIsBetter: boolean | null = true
): TrendInput => ({
  current: countAsOf(items, dateOf, referenceIso),
  previous: countAsOf(items, dateOf, addDays(referenceIso, -PERIOD_DAYS[period])),
  period,
  higherIsBetter,
});

export interface TrendResult {
  /** Signed percentage change, e.g. 12.5 or -18. */
  percent: number;
  direction: 'up' | 'down' | 'flat';
  /** Whether the change is good for the business, per `higherIsBetter`. null = neutral. */
  outcome: 'good' | 'bad' | 'neutral';
  /** Display text, e.g. "+12%" / "-18%" / "0%". */
  text: string;
}

/**
 * Turns a TrendInput into something displayable, or null when a percentage would be
 * meaningless (no baseline, or non-finite numbers). Callers hide the indicator on null.
 */
export const computeTrend = ({ current, previous, higherIsBetter = true }: TrendInput): TrendResult | null => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;

  const percent = ((current - previous) / previous) * 100;
  const flat = percent === 0;
  const rounded = Math.round(percent);
  const sign = percent > 0 ? '+' : '-';
  // Never print "0%" next to an arrow: small changes keep one decimal, tiny ones read "<0.1%".
  const text = flat
    ? '0%'
    : Math.abs(percent) < 0.1
    ? `${sign}<0.1%`
    : rounded === 0
    ? `${sign}${Math.abs(Math.round(percent * 10) / 10)}%`
    : `${rounded > 0 ? '+' : ''}${rounded}%`;

  const direction = flat ? 'flat' : percent > 0 ? 'up' : 'down';
  const outcome =
    flat || higherIsBetter === null ? 'neutral' : (percent > 0) === higherIsBetter ? 'good' : 'bad';

  return { percent, direction, outcome, text };
};
