import type { Candidate } from '../types/onboarding';
import { computeKpis, DASHBOARD_REFERENCE_DATE, isDropped, type CommandCenterKpis } from '../modules/dashboard/dashboard.metrics';
import type { DateRange } from '../modules/dashboard/dateRange';
import { addDays, countAsOf, PERIOD_DAYS, stockTrend, type TrendInput } from './trends';

/**
 * Trends for the candidate KPI cards (Dashboard, Candidate Directory, KYC desk).
 *
 * Each card compares today with the same card one month earlier. The earlier value is NOT
 * stored anywhere, so it is rebuilt by rewinding the candidate list to that date using only
 * dated facts, then running the very same KPI logic the card uses today:
 *
 *   registrationDate           candidate did not exist before it
 *   dateOfJoining (if Joined)  before it the candidate was still "Yet to Join"
 *   letter issuedDate          letter did not exist before it
 *   letter acceptedDate        before it the letter was still "Pending Acceptance"
 *   KYC record lastUpdated     a Verified candidate was not Verified before its last record update
 *
 * Not recorded anywhere: when a candidate dropped out / deferred, when a document went
 * missing, when a bank test failed. Where that makes the earlier value uncertain we compute
 * the low and high possibilities and show only the change that is true in both cases.
 */

type Kpi = keyof CommandCenterKpis;

const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

/** The candidate list as it stood at the end of `asOf`. `droppedStillActive` resolves undated drop-outs. */
export const candidatesAsOf = (candidates: Candidate[], asOf: string, droppedStillActive: boolean): Candidate[] =>
  candidates
    .filter((c) => day(c.registrationDate) <= asOf)
    .map((c) => {
      let joiningStatus = c.joiningStatus;
      if (c.joiningStatus === 'Joined' && day(c.dateOfJoining) > asOf) joiningStatus = 'Yet to Join';
      else if (isDropped(c) && droppedStillActive) joiningStatus = 'Yet to Join';

      const letters = c.letters
        .filter((l) => day(l.issuedDate) <= asOf)
        .map((l) => (l.status === 'Accepted' && day(l.acceptedDate) > asOf ? { ...l, status: 'Pending Acceptance' as const } : l));

      const lastKycUpdate = c.kycRecords.map((r) => day(r.lastUpdated)).sort().pop() ?? '';
      const overallKycStatus =
        c.overallKycStatus === 'Verified' && lastKycUpdate > asOf ? 'Pending Manual Review' : c.overallKycStatus;

      return { ...c, joiningStatus, letters, overallKycStatus };
    });

/** Trend for one KPI, or undefined when its earlier value cannot be rebuilt from recorded dates. */
const kpiTrend = (
  candidates: Candidate[],
  kpi: Kpi,
  higherIsBetter: boolean,
  refDate = DASHBOARD_REFERENCE_DATE
): TrendInput => {
  const before = addDays(refDate, -PERIOD_DAYS.month);
  const current = computeKpis(candidates, refDate)[kpi] as number;
  const a = computeKpis(candidatesAsOf(candidates, before, true), before)[kpi] as number;
  const b = computeKpis(candidatesAsOf(candidates, before, false), before)[kpi] as number;
  return {
    current,
    previous: Math.min(a, b),
    previousHigh: Math.max(a, b),
    period: 'month',
    higherIsBetter,
  };
};

export const totalCandidatesTrend = (candidates: Candidate[]): TrendInput =>
  stockTrend(candidates, (c) => c.registrationDate, DASHBOARD_REFERENCE_DATE, 'month', true);

/**
 * Blockers (open KYC issue, failed bank test, missing documents, unsigned letter) are not dated
 * except through KYC, so the earlier count is unknown. It can never exceed the number of
 * candidates who were still in onboarding then, so a rise beyond that cap is certain.
 */
export const blockersTrend = (candidates: Candidate[]): TrendInput => {
  const before = addDays(DASHBOARD_REFERENCE_DATE, -PERIOD_DAYS.month);
  const cap = Math.max(
    computeKpis(candidatesAsOf(candidates, before, true), before).activeCandidates,
    computeKpis(candidatesAsOf(candidates, before, false), before).activeCandidates
  );
  return {
    current: computeKpis(candidates).blockers,
    previous: 0,
    previousHigh: cap,
    period: 'month',
    higherIsBetter: false,
  };
};

export const joinedTrend = (candidates: Candidate[]): TrendInput => kpiTrend(candidates, 'joined', true);
export const kycVerifiedTrend = (candidates: Candidate[]): TrendInput => kpiTrend(candidates, 'kycVerified', true);
/** Fewer awaiting an accepted offer is better. */
export const pendingOffersTrend = (candidates: Candidate[]): TrendInput => kpiTrend(candidates, 'pendingOffers', false);
/** More people lined up to join in the next 7 days is better. */
export const upcomingJoiningTrend = (candidates: Candidate[]): TrendInput => kpiTrend(candidates, 'upcomingJoining', true);

/* ---------------- Date-range Overview ---------------- */

const RANGE_CAPTION = 'vs previous period';

/** The candidate list as it stood at the end of the range (the live list when the range ends today). */
export const atRangeEnd = (candidates: Candidate[], to: string, droppedStillActive = false) =>
  to >= DASHBOARD_REFERENCE_DATE ? candidates : candidatesAsOf(candidates, to, droppedStillActive);

const inRange = (iso: string | undefined, range: DateRange) => {
  const d = day(iso);
  return d >= range.from && d <= range.to;
};

/**
 * The candidates a dashboard period is about: everyone who registered or was due to join inside the range,
 * with their status as it stood on the range's last day. A different date range therefore gives a different cohort.
 */
export const cohortForRange = (candidates: Candidate[], range: DateRange, droppedStillActive = false): Candidate[] =>
  atRangeEnd(candidates, range.to, droppedStillActive).filter((c) => inRange(c.registrationDate, range) || inRange(c.dateOfJoining, range));

/** Overview KPIs for the period: the cohort's figures, with "upcoming joining" looking ahead from the range's last day. */
export const computeRangeKpis = (candidates: Candidate[], range: DateRange): CommandCenterKpis => {
  const cohort = computeKpis(cohortForRange(candidates, range), range.to);
  const ahead = computeKpis(atRangeEnd(candidates, range.to), range.to);
  return { ...cohort, upcomingJoining: ahead.upcomingJoining, joiningToday: ahead.joiningToday };
};

/** The same-length period immediately before the range. */
const previousRange = (range: DateRange): DateRange => {
  const len = Math.round((Date.parse(`${range.to}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86_400_000) + 1;
  return { from: addDays(range.from, -len), to: addDays(range.from, -1) };
};

/**
 * Overview trends: each KPI for this period against the same figure for the equally long period before it, rebuilt from
 * dated records exactly as the monthly trends are (undated drop-outs give a low / high bound).
 */
export const rangeKpiTrends = (candidates: Candidate[], range: DateRange) => {
  const kpis = computeRangeKpis(candidates, range);
  const prev = previousRange(range);
  const earlier = (droppedStillActive: boolean): CommandCenterKpis => {
    const cohort = computeKpis(cohortForRange(candidates, prev, droppedStillActive), prev.to);
    const ahead = computeKpis(atRangeEnd(candidates, prev.to, droppedStillActive), prev.to);
    return { ...cohort, upcomingJoining: ahead.upcomingJoining, joiningToday: ahead.joiningToday };
  };
  const lo = earlier(true);
  const hi = earlier(false);

  const bounded = (kpi: Kpi, higherIsBetter: boolean): TrendInput => {
    const a = lo[kpi] as number;
    const b = hi[kpi] as number;
    return { current: kpis[kpi] as number, previous: Math.min(a, b), previousHigh: Math.max(a, b), period: 'month', higherIsBetter, periodLabel: RANGE_CAPTION };
  };

  return {
    total: bounded('total', true),
    joined: bounded('joined', true),
    kycVerified: bounded('kycVerified', true),
    pendingOffers: bounded('pendingOffers', false),
    blockers: bounded('blockers', false),
    upcoming: bounded('upcomingJoining', true),
  };
};

/** KYC desk "100% Verified": every record verified and the ₹1 test passed; dated by the last record update. */
export const fullyVerifiedTrend = (pool: Candidate[]): TrendInput => {
  const verified = (c: Candidate) =>
    c.pennyTestStatus === 'Verified' && c.kycRecords.length > 0 && c.kycRecords.every((r) => r.status === 'Verified');
  const verifiedDate = (c: Candidate) => c.kycRecords.map((r) => day(r.lastUpdated)).sort().pop();
  return stockTrend(pool.filter(verified), verifiedDate, DASHBOARD_REFERENCE_DATE, 'month', true);
};

/**
 * Status cards with no status history (Yet to Join, KYC Action Required, KYC record counts ...):
 * a month ago the count could not exceed the population that existed then, so when today's count
 * is already above that cap the rise is certain. Anything else is left without a trend.
 */
const cappedTrend = (current: number, cap: number, higherIsBetter: boolean): TrendInput => ({
  current,
  previous: 0,
  previousHigh: cap,
  period: 'month',
  higherIsBetter,
});

const monthAgo = () => addDays(DASHBOARD_REFERENCE_DATE, -PERIOD_DAYS.month);
const populationCap = (candidates: Candidate[], keep: (c: Candidate) => boolean = () => true) =>
  Math.max(
    candidatesAsOf(candidates, monthAgo(), true).filter(keep).length,
    candidatesAsOf(candidates, monthAgo(), false).filter(keep).length
  );

export const yetToJoinTrend = (candidates: Candidate[]): TrendInput =>
  cappedTrend(
    candidates.filter((c) => c.joiningStatus === 'Yet to Join').length,
    populationCap(candidates, (c) => c.joiningStatus !== 'Joined'),
    true
  );

export const kycActionTrend = (candidates: Candidate[]): TrendInput =>
  cappedTrend(
    candidates.filter((c) => c.overallKycStatus === 'Pending Manual Review' || c.overallKycStatus === 'API Mismatch').length,
    populationCap(candidates),
    false
  );

/** The KYC desk's per-record metrics, defined exactly as the cards count them. */
export const KYC_RECORD_METRICS = {
  manualReview: (c: Candidate, r: Candidate['kycRecords'][number]) => r.status === 'Pending Manual Review',
  failed: (c: Candidate, r: Candidate['kycRecords'][number]) =>
    r.status === 'API Mismatch' || (r.documentType === 'Bank' && c.pennyTestStatus === 'Failed'),
  bankPending: (c: Candidate, r: Candidate['kycRecords'][number]) =>
    r.documentType === 'Bank' && (r.status === 'Pending Manual Review' || c.pennyTestStatus === 'Pending'),
};

/**
 * KYC desk record counts (fewer is better). A record's lastUpdated is when it reached its current
 * state: on or before the earlier date its state then is known exactly (low bound = those that
 * match); records changed since are uncertain (they may or may not have matched), which gives the
 * high bound.
 */
export const kycRecordTrend = (pool: Candidate[], metric: keyof typeof KYC_RECORD_METRICS): TrendInput => {
  const match = KYC_RECORD_METRICS[metric];
  const before = monthAgo();
  let current = 0;
  let known = 0;
  let unknown = 0;
  for (const c of pool) {
    const existed = day(c.registrationDate) <= before;
    for (const r of c.kycRecords) {
      const hit = match(c, r);
      if (hit) current++;
      if (!existed) continue;
      if (day(r.lastUpdated) > before) unknown++;
      else if (hit) known++;
    }
  }
  return { current, previous: known, previousHigh: known + unknown, period: 'month', higherIsBetter: false };
};
