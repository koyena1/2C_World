import { contractsNeedingClientIntimationCount, expiringContractCount } from '../../../data/mockContractData';
import { esicDuplicateErrorCount } from '../../../data/mockEsicData';
import { pendingExitDocumentCount } from '../../../data/mockExitData';
import { pendingRegularizationCount } from '../../../data/mockRegularizationData';
import { uanPendingCount } from '../../../data/mockUanData';
import { accessFor, type FeatureId } from '../../hr-ops/hrOps.config';
import { DASHBOARD_REFERENCE_DATE, type PendingActionMetric } from '../dashboard.metrics';

/** Counts behind the Operational Overview, the Action Required rows and the sidebar dots (initial mock state). */
export const hrOpsCounts = () => ({
  contractsExpiring: expiringContractCount(35, DASHBOARD_REFERENCE_DATE),
  intimationsDue: contractsNeedingClientIntimationCount(DASHBOARD_REFERENCE_DATE),
  regularizations: pendingRegularizationCount(),
  uanPending: uanPendingCount(),
  esicDuplicates: esicDuplicateErrorCount(),
  exitDocsPending: pendingExitDocumentCount(),
});

/** Extra Action Required rows, limited to the modules the active role can open. */
export const hrOpsActions = (role: string): PendingActionMetric[] => {
  const c = hrOpsCounts();
  const rows: (PendingActionMetric & { feature: FeatureId })[] = [
    { id: 'contracts', feature: 'contract-closure', label: 'Contracts expiring', hint: 'Within 35 days: reminder and client intimation', count: c.contractsExpiring, tone: 'warn', target: 'contract-exit' },
    { id: 'regularization', feature: 'attendance-regularization', label: 'Attendance regularizations', hint: 'Requests waiting for approval (E-Sampark)', count: c.regularizations, tone: 'info', target: 'attendance' },
    { id: 'esic', feature: 'esic-validation', label: 'ESIC duplicate errors', hint: 'Uploaded rows that need correcting', count: c.esicDuplicates, tone: 'bad', target: 'compliance' },
    { id: 'uan', feature: 'uan-esic-log', label: 'UAN not registered', hint: 'Candidates still without a UAN', count: c.uanPending, tone: 'violet', target: 'compliance' },
    { id: 'exitdocs', feature: 'exit-documentation', label: 'Exit documents pending', hint: 'Exit cases missing required documents', count: c.exitDocsPending, tone: 'warn', target: 'contract-exit' },
  ];
  return rows.filter((r) => accessFor(r.feature, role) !== 'none').map(({ feature: _f, ...row }) => row);
};
