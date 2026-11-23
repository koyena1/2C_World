import { MOCK_CANDIDATES } from './mockOnboardingData';

/** Mock UAN / ESIC update records and PF applicability data (frontend simulation). */

export type UanStatus = 'Pending' | 'Updated';
export type EsicStatus = 'Pending' | 'Updated' | 'Not applicable';

export interface UanEsicRecord {
  candidateId: string;
  uan: string;
  esic: string;
  uanStatus: UanStatus;
  esicStatus: EsicStatus;
  updatedById: string;
  updatedBy: string;
  /** ISO timestamp of the last update; empty until something has been recorded. */
  updatedAt: string;
}

export interface UanEsicHistoryRow {
  id: string;
  field: 'UAN' | 'ESIC';
  oldValue: string;
  newValue: string;
  actorName: string;
  at: string;
}

const OPERATORS = [
  { id: 'USR-001', name: 'Ananya (Ops Lead)' },
  { id: 'USR-014', name: 'Vikram (Client HR)' },
  { id: 'USR-032', name: 'Rohit Nair (Compliance Exec)' },
  { id: 'USR-035', name: 'Meera Joshi (Compliance Exec)' },
];

const digits = (seed: number, len: number) => {
  let out = '';
  let x = seed * 7919 + 104729;
  while (out.length < len) {
    x = (x * 1103515245 + 12345) % 2147483647;
    out += String(x % 10);
  }
  return out.replace(/^0/, '1');
};

const pad = (n: number) => String(n).padStart(2, '0');
/** Fixed timestamp between 2026-08-12 and 2026-10-04. */
const stamp = (i: number, hourSeed: number) => {
  const dayOffset = (i * 5) % 54;
  const d = new Date(Date.UTC(2026, 7, 12 + dayOffset));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(9 + (hourSeed % 9))}:${pad((hourSeed * 7) % 60)}:00+05:30`;
};

const buildRecords = (): UanEsicRecord[] =>
  MOCK_CANDIDATES.map((c, i) => {
    const uanPending = i % 3 === 0 || i % 7 === 4;
    const esicStatus: EsicStatus = i % 6 === 5 ? 'Not applicable' : i % 4 === 1 ? 'Pending' : 'Updated';
    const op = OPERATORS[i % OPERATORS.length];
    const touched = !(uanPending && esicStatus !== 'Updated');
    return {
      candidateId: c.id,
      uan: uanPending ? '' : `1${digits(i + 1, 11)}`,
      esic: esicStatus === 'Updated' ? digits(i + 40, 10) + digits(i + 90, 7) : '',
      uanStatus: uanPending ? 'Pending' : 'Updated',
      esicStatus,
      updatedById: touched ? op.id : '',
      updatedBy: touched ? op.name : '',
      updatedAt: touched ? stamp(i, i + 3) : '',
    };
  });

export const MOCK_UAN_ESIC_RECORDS: UanEsicRecord[] = buildRecords();

const buildHistory = (): Record<string, UanEsicHistoryRow[]> => {
  const out: Record<string, UanEsicHistoryRow[]> = {};
  MOCK_UAN_ESIC_RECORDS.forEach((r, i) => {
    if (!r.updatedAt) return;
    const rows: UanEsicHistoryRow[] = [];
    const op = OPERATORS[(i + 1) % OPERATORS.length];
    if (r.esicStatus === 'Updated') {
      if (i % 3 === 1) {
        const first = digits(i + 500, 17);
        rows.push({ id: `${r.candidateId}-h1`, field: 'ESIC', oldValue: '', newValue: first, actorName: op.name, at: stamp(i + 20, i + 1) });
        rows.push({ id: `${r.candidateId}-h2`, field: 'ESIC', oldValue: first, newValue: r.esic, actorName: r.updatedBy, at: r.updatedAt });
      } else {
        rows.push({ id: `${r.candidateId}-h2`, field: 'ESIC', oldValue: '', newValue: r.esic, actorName: r.updatedBy, at: r.updatedAt });
      }
    }
    if (r.uanStatus === 'Updated') {
      rows.push({ id: `${r.candidateId}-h3`, field: 'UAN', oldValue: '', newValue: r.uan, actorName: r.updatedBy, at: r.updatedAt });
    }
    out[r.candidateId] = rows.sort((a, b) => b.at.localeCompare(a.at));
  });
  return out;
};

const SEED_HISTORY = buildHistory();

/** Candidates whose UAN is not registered yet (mock initial state). */
export const uanPendingCount = (): number => MOCK_UAN_ESIC_RECORDS.filter((r) => r.uanStatus === 'Pending').length;

/** Seed history for one candidate, newest first. */
export const getUanEsicHistory = (candidateId: string): UanEsicHistoryRow[] => SEED_HISTORY[candidateId] ?? [];

/* ------------------------------ PF configuration ------------------------------ */

export interface PfRules {
  /** Statutory basic-wage ceiling (Rs per month). */
  wageCeiling: number;
  /** Employee and employer contribution rate (%). */
  contributionRate: number;
  /** PF is mandatory for wages up to the ceiling. */
  mandatoryBelowCeiling: boolean;
  /** Existing PF members above the ceiling may continue (capped at the ceiling). */
  voluntaryAboveCeiling: boolean;
  /** New joiners above the ceiling with no earlier PF membership are exempt unless opted in. */
  newJoinerExemption: boolean;
  /** Share of gross treated as basic wage in this mock. */
  basicPercentOfGross: number;
}

export const DEFAULT_PF_RULES: PfRules = {
  wageCeiling: 15000,
  contributionRate: 12,
  mandatoryBelowCeiling: true,
  voluntaryAboveCeiling: true,
  newJoinerExemption: true,
  basicPercentOfGross: 50,
};

export interface PfClientConfig {
  clientId: string;
  clientName: string;
  /** Client default for the "Higher-wage contribution opted in" flag. */
  higherWageDefault: boolean;
  updatedBy: string;
  updatedAt: string;
}

export const MOCK_PF_CLIENT_CONFIG: PfClientConfig[] = [
  { clientId: 'client-tcs', clientName: 'Tata Consultancy Services', higherWageDefault: true, updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-09-02T11:20:00+05:30' },
  { clientId: 'client-infosys', clientName: 'Infosys Technologies', higherWageDefault: true, updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-09-02T11:24:00+05:30' },
  { clientId: 'client-hdfc', clientName: 'HDFC Bank Ltd', higherWageDefault: false, updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-08-21T16:05:00+05:30' },
  { clientId: 'client-flipkart', clientName: 'Flipkart Internet Pvt Ltd', higherWageDefault: false, updatedBy: 'Rohit Nair (Compliance Exec)', updatedAt: '2026-09-14T10:10:00+05:30' },
  { clientId: 'client-lt', clientName: 'Larsen & Toubro Ltd', higherWageDefault: true, updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-08-29T14:42:00+05:30' },
  { clientId: 'client-wipro', clientName: 'Wipro Digital', higherWageDefault: false, updatedBy: 'Meera Joshi (Compliance Exec)', updatedAt: '2026-09-18T09:35:00+05:30' },
  { clientId: 'client-reliance', clientName: 'Reliance Retail Ltd', higherWageDefault: false, updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-08-17T12:00:00+05:30' },
];

export type PfOverride = 'inherit' | 'opted-in' | 'opted-out';

export interface PfCandidateRecord {
  candidateId: string;
  /** Previous employer UAN (kept separately from the new one). */
  oldUan: string;
  /** UAN created / activated for this engagement. */
  newUan: string;
  uanRegistered: boolean;
  pfLinked: boolean;
  override: PfOverride;
  updatedBy: string;
  updatedAt: string;
}

const buildPf = (): PfCandidateRecord[] =>
  MOCK_CANDIDATES.map((c, i) => {
    const uanRec = MOCK_UAN_ESIC_RECORDS[i];
    const hasOld = i % 3 === 1 || i % 5 === 2;
    const registered = uanRec.uanStatus === 'Updated';
    return {
      candidateId: c.id,
      oldUan: hasOld ? `1${digits(i + 200, 11)}` : '',
      newUan: registered ? uanRec.uan : '',
      uanRegistered: registered,
      pfLinked: registered && i % 4 !== 2,
      override: i % 8 === 3 ? 'opted-in' : i % 8 === 6 ? 'opted-out' : 'inherit',
      updatedBy: uanRec.updatedBy || 'Ananya (Ops Lead)',
      updatedAt: uanRec.updatedAt || '2026-09-20T10:00:00+05:30',
    };
  });

export const MOCK_PF_CANDIDATE_RECORDS: PfCandidateRecord[] = buildPf();

export type PfApplicability = 'Mandatory' | 'Higher-wage opted in' | 'Voluntary (capped)' | 'Exempt' | 'Not applicable';

/** Applies the rule set and the higher-wage flag. `hadPriorPf` is true when an old UAN exists. */
export const resolvePfApplicability = (
  basicWage: number,
  rules: PfRules,
  optedIn: boolean,
  hadPriorPf: boolean,
): { result: PfApplicability; note: string } => {
  if (basicWage <= rules.wageCeiling) {
    return rules.mandatoryBelowCeiling
      ? { result: 'Mandatory', note: `Basic wage is within the Rs ${rules.wageCeiling.toLocaleString('en-IN')} ceiling.` }
      : { result: 'Not applicable', note: 'Mandatory coverage below the ceiling is switched off.' };
  }
  if (optedIn) return { result: 'Higher-wage opted in', note: 'Above ceiling: contributes on the actual basic wage because the higher-wage flag is on.' };
  if (!hadPriorPf && rules.newJoinerExemption) return { result: 'Exempt', note: 'Above ceiling, new joiner with no earlier PF membership.' };
  if (rules.voluntaryAboveCeiling) return { result: 'Voluntary (capped)', note: 'Above ceiling, existing member: voluntary, contribution capped at the ceiling.' };
  return { result: 'Not applicable', note: 'Above ceiling and voluntary contribution is not allowed.' };
};
