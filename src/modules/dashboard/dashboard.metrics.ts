import type { Candidate, JoiningStatus, KycDocumentStatus } from '../../types/onboarding';
import type { Tone } from './command-center/types';

/**
 * Command-center metrics, derived ONLY from the live `Candidate[]` list
 * (the same data the Candidate Directory shows). Nothing here is invented:
 * every figure is a count / ratio over fields that exist on `Candidate`.
 */

/** The prototype's "today" (the demo data spans Sep-Oct 2026). */
export const DASHBOARD_REFERENCE_DATE = '2026-10-05';
const UPCOMING_WINDOW_DAYS = 7;
export const UPCOMING_WINDOW_LABEL = `next ${UPCOMING_WINDOW_DAYS} days`;

const INACTIVE_STATUSES: JoiningStatus[] = ['Joined', 'Offer Dropped', 'Dropout', 'Deferred'];
const DROPPED_STATUSES: JoiningStatus[] = ['Offer Dropped', 'Dropout', 'Deferred'];
const KYC_OPEN: KycDocumentStatus[] = ['Pending Manual Review', 'API Mismatch', 'Rejected'];

export const isActive = (c: Candidate) => !INACTIVE_STATUSES.includes(c.joiningStatus);
export const isDropped = (c: Candidate) => DROPPED_STATUSES.includes(c.joiningStatus);

const hasKycIssue = (c: Candidate) => KYC_OPEN.includes(c.overallKycStatus);
const hasBankFailure = (c: Candidate) => c.pennyTestStatus === 'Failed';
const hasMissingDocs = (c: Candidate) => c.missingFields.length > 0;
const hasUnsignedLetter = (c: Candidate) => c.letters.some((l) => l.status === 'Pending Acceptance');
const hasAnyBlocker = (c: Candidate) =>
  hasKycIssue(c) || hasBankFailure(c) || hasMissingDocs(c) || hasUnsignedLetter(c);

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

const isInUpcomingWindow = (c: Candidate) =>
  c.dateOfJoining >= DASHBOARD_REFERENCE_DATE &&
  c.dateOfJoining <= addDays(DASHBOARD_REFERENCE_DATE, UPCOMING_WINDOW_DAYS);

/* ---------------- KPIs ---------------- */

export interface CommandCenterKpis {
  total: number;
  clients: number;
  joined: number;
  kycVerified: number;
  pendingOffers: number;
  offersNotIssued: number;
  offersDraft: number;
  offersUnsigned: number;
  blockers: number;
  activeCandidates: number;
  upcomingJoining: number;
  joiningToday: number;
}

export const computeKpis = (candidates: Candidate[]): CommandCenterKpis => {
  const active = candidates.filter(isActive);
  const awaitingOffer = active.filter((c) => !c.letters.some((l) => l.status === 'Accepted'));
  const offersUnsigned = awaitingOffer.filter(hasUnsignedLetter).length;
  const offersNotIssued = awaitingOffer.filter((c) => !hasUnsignedLetter(c) && c.letters.length === 0).length;

  return {
    total: candidates.length,
    clients: new Set(candidates.map((c) => c.clientId)).size,
    joined: candidates.filter((c) => c.joiningStatus === 'Joined').length,
    kycVerified: candidates.filter((c) => c.overallKycStatus === 'Verified').length,
    pendingOffers: awaitingOffer.length,
    offersNotIssued,
    offersDraft: awaitingOffer.length - offersUnsigned - offersNotIssued,
    offersUnsigned,
    blockers: active.filter(hasAnyBlocker).length,
    activeCandidates: active.length,
    upcomingJoining: active.filter(isInUpcomingWindow).length,
    joiningToday: active.filter((c) => c.dateOfJoining === DASHBOARD_REFERENCE_DATE).length,
  };
};

/* ---------------- Pipeline ---------------- */

export interface PipelineStageMetric {
  id: string;
  label: string;
  count: number;
  pct: number;
  tone: Tone;
}

/**
 * Stage counts are independent "has reached" counts (a candidate can be Joined without
 * a letter record), so each is shown as a share of everyone added.
 * "Invited" is not tracked in the data model; "Profile Started" (onboarding completion > 0)
 * is the earliest candidate-side signal available.
 */
export const computePipeline = (candidates: Candidate[]): PipelineStageMetric[] => {
  const total = candidates.length;
  const stages: Array<Omit<PipelineStageMetric, 'pct'>> = [
    { id: 'added', label: 'Added', count: total, tone: 'muted' },
    { id: 'started', label: 'Profile Started', count: candidates.filter((c) => c.onboardingCompletionPct > 0).length, tone: 'info' },
    { id: 'verified', label: 'KYC Verified', count: candidates.filter((c) => c.overallKycStatus === 'Verified').length, tone: 'violet' },
    { id: 'offer', label: 'Offer Sent', count: candidates.filter((c) => c.letters.some((l) => l.status !== 'Draft')).length, tone: 'teal' },
    { id: 'joined', label: 'Joined', count: candidates.filter((c) => c.joiningStatus === 'Joined').length, tone: 'good' },
  ];
  return stages.map((s) => ({ ...s, pct: pct(s.count, total) }));
};

export interface StatusSlice {
  status: JoiningStatus;
  count: number;
  tone: Tone;
}

const STATUS_TONE: Record<JoiningStatus, Tone> = {
  Joined: 'good',
  'Offer Accepted': 'teal',
  'Yet to Join': 'info',
  'Verification In Progress': 'violet',
  Deferred: 'warn',
  'Offer Dropped': 'bad',
  Dropout: 'bad',
};

export const computeStatusMix = (candidates: Candidate[]): StatusSlice[] =>
  (Object.keys(STATUS_TONE) as JoiningStatus[])
    .map((status) => ({ status, count: candidates.filter((c) => c.joiningStatus === status).length, tone: STATUS_TONE[status] }))
    .filter((s) => s.count > 0);

/* ---------------- Pending actions ---------------- */

export interface PendingActionMetric {
  id: string;
  label: string;
  hint: string;
  count: number;
  tone: Tone;
  /** App view opened when the row is clicked. */
  target: string;
}

export const computePendingActions = (candidates: Candidate[]): PendingActionMetric[] => {
  const active = candidates.filter(isActive);

  return [
    { id: 'kyc', label: 'Pending KYC', hint: 'Manual review, API mismatch or rejected', count: active.filter(hasKycIssue).length, tone: 'warn', target: 'kyc' },
    { id: 'bank', label: 'Failed bank verification', hint: 'Rs 1 penny test failed', count: active.filter(hasBankFailure).length, tone: 'bad', target: 'kyc' },
    { id: 'docs', label: 'Missing documents', hint: 'Candidate has outstanding fields', count: active.filter(hasMissingDocs).length, tone: 'violet', target: 'directory' },
    { id: 'letters', label: 'Unsigned offer letters', hint: 'Issued, awaiting acceptance', count: active.filter(hasUnsignedLetter).length, tone: 'info', target: 'offer-letters' },
    {
      id: 'joining',
      label: 'Joining blockers',
      hint: `Joining in the ${UPCOMING_WINDOW_LABEL} with an open issue`,
      count: active.filter((c) => isInUpcomingWindow(c) && hasAnyBlocker(c)).length,
      tone: 'bad',
      target: 'directory',
    },
  ];
};

/* ---------------- Clients ---------------- */

export interface ClientMetric {
  clientId: string;
  clientName: string;
  total: number;
  joined: number;
  inProgress: number;
  dropped: number;
  kycVerified: number;
  blockers: number;
}

export const computeClientMetrics = (candidates: Candidate[]): ClientMetric[] => {
  const map = new Map<string, Candidate[]>();
  candidates.forEach((c) => map.set(c.clientId, [...(map.get(c.clientId) ?? []), c]));

  return [...map.values()]
    .map((list) => ({
      clientId: list[0].clientId,
      clientName: list[0].clientName,
      total: list.length,
      joined: list.filter((c) => c.joiningStatus === 'Joined').length,
      dropped: list.filter(isDropped).length,
      inProgress: list.filter(isActive).length,
      kycVerified: list.filter((c) => c.overallKycStatus === 'Verified').length,
      blockers: list.filter((c) => isActive(c) && hasAnyBlocker(c)).length,
    }))
    .sort((a, b) => b.total - a.total || a.clientName.localeCompare(b.clientName));
};

/* ---------------- Recruiters ---------------- */

export interface RecruiterMetric {
  name: string;
  handled: number;
  joined: number;
  pending: number;
  dropped: number;
  joinRatePct: number;
}

export const computeRecruiterMetrics = (candidates: Candidate[]): RecruiterMetric[] => {
  const map = new Map<string, Candidate[]>();
  candidates.forEach((c) => map.set(c.recruiterName, [...(map.get(c.recruiterName) ?? []), c]));

  return [...map.entries()]
    .map(([name, list]) => {
      const joined = list.filter((c) => c.joiningStatus === 'Joined').length;
      return {
        name,
        handled: list.length,
        joined,
        pending: list.filter(isActive).length,
        dropped: list.filter(isDropped).length,
        joinRatePct: pct(joined, list.length),
      };
    })
    .sort((a, b) => b.handled - a.handled || a.name.localeCompare(b.name));
};

/* ---------------- Joining overview ---------------- */

export interface JoiningEntry {
  candidate: Candidate;
  hasBlocker: boolean;
}

export interface JoiningOverview {
  today: JoiningEntry[];
  upcoming: JoiningEntry[];
}

export const computeJoiningOverview = (candidates: Candidate[]): JoiningOverview => {
  const toEntry = (candidate: Candidate): JoiningEntry => ({ candidate, hasBlocker: hasAnyBlocker(candidate) });
  const notDropped = candidates.filter((c) => !isDropped(c));

  return {
    today: notDropped.filter((c) => c.dateOfJoining === DASHBOARD_REFERENCE_DATE).map(toEntry),
    upcoming: notDropped
      .filter((c) => c.dateOfJoining > DASHBOARD_REFERENCE_DATE && c.joiningStatus !== 'Joined')
      .sort((a, b) => a.dateOfJoining.localeCompare(b.dateOfJoining))
      .map(toEntry),
  };
};

/* ---------------- Recent activity ---------------- */

export type ActivityKind = 'Onboarding' | 'KYC' | 'Offer';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  title: string;
  candidate: string;
  actor?: string;
  /** Sortable epoch ms */
  at: number;
  /** Original timestamp text from the data */
  atLabel: string;
}

/** Parses "2026-09-14" or "2026-09-14 11:20 AM" to epoch ms (local time). */
const parseStamp = (raw: string): number => {
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
  if (!m) return 0;
  let hour = m[4] ? Number(m[4]) : 0;
  if (m[6]) hour = (hour % 12) + (m[6].toUpperCase() === 'PM' ? 12 : 0);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour, m[5] ? Number(m[5]) : 0).getTime();
};

export const computeRecentActivity = (candidates: Candidate[], limit = 8): ActivityEvent[] => {
  const events: ActivityEvent[] = [];

  candidates.forEach((c) => {
    const name = `${c.firstName} ${c.lastName}`.trim();

    events.push({
      id: `${c.id}-registered`,
      kind: 'Onboarding',
      title: 'Candidate added',
      candidate: name,
      actor: c.recruiterName,
      at: parseStamp(c.registrationDate),
      atLabel: c.registrationDate,
    });

    c.kycRecords.forEach((r) =>
      r.auditTrail.forEach((a) =>
        events.push({
          id: `${c.id}-${r.id}-${a.id}`,
          kind: 'KYC',
          title: `${r.documentType}: ${a.action}`,
          candidate: name,
          actor: a.actor,
          at: parseStamp(a.timestamp),
          atLabel: a.timestamp,
        })
      )
    );

    c.letters.forEach((l) => {
      events.push({
        id: `${c.id}-${l.id}-issued`,
        kind: 'Offer',
        title: `${l.title} issued`,
        candidate: name,
        at: parseStamp(l.issuedDate),
        atLabel: l.issuedDate,
      });
      if (l.acceptedDate) {
        events.push({
          id: `${c.id}-${l.id}-accepted`,
          kind: 'Offer',
          title: `${l.title} accepted`,
          candidate: name,
          at: parseStamp(l.acceptedDate),
          atLabel: l.acceptedDate,
        });
      }
    });
  });

  return events.filter((e) => e.at > 0).sort((a, b) => b.at - a.at).slice(0, limit);
};
