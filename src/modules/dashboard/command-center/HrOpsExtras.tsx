import { MOCK_CONTRACTS, daysLeft, effectiveEndDate, isClosed, type ContractRecord } from '../../../data/mockContractData';
import { INITIAL_ESIC_BATCH, validateEsicBatch, type EsicUploadRow } from '../../../data/mockEsicData';
import { EXIT_CASES, buildSeedExitDocs, pendingDocIds, type ExitCase } from '../../../data/mockExitData';
import { INITIAL_REGULARIZATION_REQUESTS, type RegularizationRequest } from '../../../data/mockRegularizationData';
import { MOCK_UAN_ESIC_RECORDS, type UanEsicRecord } from '../../../data/mockUanData';
import { addDaysIso } from '../../../utils/today';
import { accessFor, type FeatureId } from '../../hr-ops/hrOps.config';
import { DASHBOARD_REFERENCE_DATE, type PendingActionMetric } from '../dashboard.metrics';

/**
 * The slice of HR-operations data a dashboard date filter looks at: open items dated inside the selected range
 * (plus those that fall due shortly after it). Without a scope the live, as-of-today figures are used.
 */
export interface OpsScope {
  /** First and last day of the selected range. */
  from: string;
  to: string;
  /** Candidates (ids) that exist as of that day. */
  candidateIds: Set<string>;
}

const asOf = (scope?: OpsScope) => scope?.to ?? DASHBOARD_REFERENCE_DATE;
/** First day counted; without a scope only items falling due from today on. */
const startOf = (scope?: OpsScope) => scope?.from ?? DASHBOARD_REFERENCE_DATE;

export const opsExpiringContracts = (scope?: OpsScope): ContractRecord[] => {
  const ref = asOf(scope);
  const from = startOf(scope);
  return MOCK_CONTRACTS.filter((c) => {
    const end = effectiveEndDate(c);
    return c.startDate <= ref && !isClosed(c) && end >= from && daysLeft(c, ref) <= 35;
  });
};

/** Contracts inside the 30-day client-intimation window with no intimation sent by that day. */
export const opsIntimationsDue = (scope?: OpsScope): ContractRecord[] => {
  const ref = asOf(scope);
  const from = startOf(scope);
  return MOCK_CONTRACTS.filter((c) => {
    const sentBy = c.intimationSentAt ? c.intimationSentAt.slice(0, 10) <= ref : false;
    return c.startDate <= ref && !isClosed(c) && effectiveEndDate(c) >= from && daysLeft(c, ref) <= 30 && !sentBy;
  });
};

export const opsPendingRegularizations = (scope?: OpsScope): RegularizationRequest[] => {
  const ref = asOf(scope);
  return INITIAL_REGULARIZATION_REQUESTS.filter((r) => r.status === 'Pending' && r.date >= (scope?.from ?? '') && r.date <= ref);
};

export const opsPendingUan = (scope?: OpsScope): UanEsicRecord[] =>
  MOCK_UAN_ESIC_RECORDS.filter((r) => r.uanStatus === 'Pending' && (!scope || scope.candidateIds.has(r.candidateId)));

export const opsEsicDuplicates = (scope?: OpsScope): Array<{ row: EsicUploadRow; message: string }> => {
  const ref = asOf(scope);
  const results = validateEsicBatch(INITIAL_ESIC_BATCH);
  return INITIAL_ESIC_BATCH.flatMap((row) => {
    const uploadedOn = addDaysIso(DASHBOARD_REFERENCE_DATE, -(row.uploadedDaysAgo ?? 0));
    const r = results[row.id];
    return r?.kind === 'duplicate' && uploadedOn >= (scope?.from ?? '') && uploadedOn <= ref ? [{ row, message: r.message }] : [];
  });
};

export const opsExitDocCases = (scope?: OpsScope): Array<{ exit: ExitCase; missing: string[] }> => {
  const ref = asOf(scope);
  const docs = buildSeedExitDocs();
  return EXIT_CASES.flatMap((ec) => {
    const missing = pendingDocIds(ec.exitType, docs[ec.id]);
    return ec.noticeDate >= (scope?.from ?? '') && ec.noticeDate <= ref && missing.length > 0 ? [{ exit: ec, missing }] : [];
  });
};

/** Counts behind the Operational Overview, the Action Required rows and the sidebar dots. */
export const hrOpsCounts = (scope?: OpsScope) => ({
  contractsExpiring: opsExpiringContracts(scope).length,
  intimationsDue: opsIntimationsDue(scope).length,
  regularizations: opsPendingRegularizations(scope).length,
  uanPending: opsPendingUan(scope).length,
  esicDuplicates: opsEsicDuplicates(scope).length,
  exitDocsPending: opsExitDocCases(scope).length,
});

/** Extra Action Required rows, limited to the modules the active role can open. */
export const hrOpsActions = (role: string, scope?: OpsScope): PendingActionMetric[] => {
  const c = hrOpsCounts(scope);
  const rows: (PendingActionMetric & { feature: FeatureId })[] = [
    { id: 'contracts', feature: 'contract-closure', label: 'Contracts expiring', hint: 'Within 35 days: reminder and client intimation', count: c.contractsExpiring, tone: 'warn', target: 'contract-exit' },
    { id: 'regularization', feature: 'attendance-regularization', label: 'Attendance regularizations', hint: 'Requests waiting for approval (E-Sampark)', count: c.regularizations, tone: 'info', target: 'attendance' },
    { id: 'esic', feature: 'esic-validation', label: 'ESIC duplicate errors', hint: 'Uploaded rows that need correcting', count: c.esicDuplicates, tone: 'bad', target: 'compliance' },
    { id: 'uan', feature: 'uan-esic-log', label: 'UAN not registered', hint: 'Candidates still without a UAN', count: c.uanPending, tone: 'violet', target: 'compliance' },
    { id: 'exitdocs', feature: 'exit-documentation', label: 'Exit documents pending', hint: 'Exit cases missing required documents', count: c.exitDocsPending, tone: 'warn', target: 'contract-exit' },
  ];
  return rows.filter((r) => accessFor(r.feature, role) !== 'none').map(({ feature: _f, ...row }) => row);
};
