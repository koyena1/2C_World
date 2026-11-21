import type { Candidate } from '../types/onboarding';
import { DASHBOARD_REFERENCE_DATE } from '../modules/dashboard/dashboard.metrics';
import { stockTrend, type TrendInput } from './trends';

/**
 * Trends for the candidate-based KPI cards, shared by the Dashboard, Candidate Directory and
 * KYC desk. Each one is rebuilt from real dated fields on the candidate list the card shows:
 *
 *   Total candidates : candidates whose registrationDate is on/before the day
 *   Joined           : candidates with status Joined whose dateOfJoining is on/before the day
 *
 * Everything else on those screens (KYC verified, pending offers, blockers, upcoming joinings,
 * yet-to-join ...) is a snapshot of CURRENT state with no stored history, so it gets no trend.
 */

export const totalCandidatesTrend = (candidates: Candidate[]): TrendInput =>
  stockTrend(candidates, (c) => c.registrationDate, DASHBOARD_REFERENCE_DATE, 'month', true);

export const joinedTrend = (candidates: Candidate[]): TrendInput =>
  stockTrend(
    candidates.filter((c) => c.joiningStatus === 'Joined'),
    (c) => c.dateOfJoining,
    DASHBOARD_REFERENCE_DATE,
    'month',
    true
  );
