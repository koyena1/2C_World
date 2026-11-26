import React from 'react';
import type { Candidate } from '../../../types/onboarding';
import type { KpiDetailColumn, KpiDetailData } from '../../../components/page/KpiDetailPanel';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { daysLeft, effectiveEndDate, formatContractDate } from '../../../data/mockContractData';
import { EXIT_DOC_TYPES } from '../../../data/mockExitData';
import { opsEsicDuplicates, opsExitDocCases, opsExpiringContracts, opsPendingRegularizations, opsPendingUan, type OpsScope } from './HrOpsExtras';
import {
  UPCOMING_WINDOW_LABEL,
  blockerReasons,
  isActive,
  isAwaitingOffer,
  joinsInUpcomingWindow,
  type PendingActionMetric,
} from '../dashboard.metrics';

/** Stable ids of the Overview tiles that open a detail table. */
export type OverviewTileId =
  | 'total'
  | 'joined'
  | 'pending-actions'
  | 'in-progress'
  | 'kyc-verified'
  | 'pending-offers'
  | 'blockers'
  | 'upcoming'
  | 'contracts'
  | 'regularizations'
  | 'compliance'
  | 'exit-docs';

const CANDIDATE_COLUMNS: KpiDetailColumn[] = [
  { key: 'name', label: 'Candidate', className: 'font-semibold whitespace-nowrap' },
  { key: 'userId', label: 'User ID', className: 'font-mono whitespace-nowrap' },
  { key: 'client', label: 'Client' },
  { key: 'role', label: 'Designation' },
  { key: 'status', label: 'Joining Status' },
  { key: 'doj', label: 'Joining Date', className: 'font-mono whitespace-nowrap' },
];

const candidateRow = (c: Candidate, extra: Record<string, React.ReactNode> = {}) => ({
  name: `${c.firstName} ${c.lastName}`,
  userId: c.userId,
  client: c.clientName,
  role: c.designation,
  status: <StatusBadge type="joining" status={c.joiningStatus} size="sm" />,
  doj: c.dateOfJoining,
  ...extra,
});

const candidateDetail = (title: string, list: Candidate[], extraCol?: KpiDetailColumn, extra?: (c: Candidate) => Record<string, React.ReactNode>): KpiDetailData => ({
  title,
  columns: extraCol ? [...CANDIDATE_COLUMNS, extraCol] : CANDIDATE_COLUMNS,
  rows: list.map((c) => candidateRow(c, extra?.(c))),
  emptyText: 'No candidates for this figure in the selected period.',
});

const nameById = (candidates: Candidate[]) => new Map(candidates.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));

interface Inputs {
  /** Candidates for the selected dashboard period (the same cohort the KPI numbers come from). */
  candidates: Candidate[];
  /** Everyone as of the period's last day (upcoming joiners may have registered before the period). */
  allCandidates: Candidate[];
  /** Range the HR-operations figures are counted over. */
  scope: OpsScope;
  refDate: string;
  actions: PendingActionMetric[];
}

/** Builds the detail table for one Overview tile from the same data its number is counted from. */
export const buildOverviewDetail = (id: OverviewTileId, { candidates, allCandidates, scope, refDate, actions }: Inputs): KpiDetailData => {
  switch (id) {
    case 'total':
      return candidateDetail('Total Candidates', candidates);
    case 'joined':
      return candidateDetail('Joined', candidates.filter((c) => c.joiningStatus === 'Joined'));
    case 'in-progress':
      return candidateDetail('In Progress', candidates.filter(isActive));
    case 'kyc-verified':
      return candidateDetail('KYC Verified', candidates.filter((c) => c.overallKycStatus === 'Verified'));
    case 'pending-offers':
      return candidateDetail('Pending Offers', candidates.filter(isAwaitingOffer), { key: 'offer', label: 'Offer Letter' }, (c) => ({
        offer: c.letters.some((l) => l.status === 'Pending Acceptance') ? 'Unsigned' : c.letters.length === 0 ? 'Not issued' : 'Draft',
      }));
    case 'blockers':
      return candidateDetail(
        'Operational Blockers',
        candidates.filter((c) => isActive(c) && blockerReasons(c).length > 0),
        { key: 'why', label: 'Open Issues' },
        (c) => ({ why: blockerReasons(c).join(' · ') })
      );
    case 'upcoming':
      return candidateDetail(`Upcoming Joining (${UPCOMING_WINDOW_LABEL})`, allCandidates.filter((c) => joinsInUpcomingWindow(c, refDate)));
    case 'pending-actions':
      return {
        title: 'Pending Actions',
        subtitle: 'Open items in every Action Required category',
        columns: [
          { key: 'label', label: 'Category', className: 'font-semibold' },
          { key: 'hint', label: 'What is pending' },
          { key: 'count', label: 'Open Items', align: 'right', className: 'tabular-nums font-semibold' },
        ],
        rows: actions.map((a) => ({ label: a.label, hint: a.hint, count: a.count })),
      };
    case 'contracts':
      return {
        title: 'Contracts expiring in 35 days',
        columns: [
          { key: 'emp', label: 'Employee', className: 'font-semibold whitespace-nowrap' },
          { key: 'code', label: 'Emp Code', className: 'font-mono whitespace-nowrap' },
          { key: 'client', label: 'Client' },
          { key: 'end', label: 'Contract End', className: 'font-mono whitespace-nowrap' },
          { key: 'left', label: 'Days Left', align: 'right', className: 'tabular-nums' },
          { key: 'intim', label: 'Client Intimation' },
        ],
        rows: opsExpiringContracts(scope).map((c) => ({
          emp: c.employeeName,
          code: c.employeeCode,
          client: c.clientName,
          end: formatContractDate(effectiveEndDate(c)),
          left: daysLeft(c, scope.to),
          intim: c.intimationSentAt ? 'Sent' : 'Pending',
        })),
      };
    case 'regularizations':
      return {
        title: 'Pending regularizations',
        columns: [
          { key: 'emp', label: 'Employee', className: 'font-semibold whitespace-nowrap' },
          { key: 'code', label: 'Emp Code', className: 'font-mono whitespace-nowrap' },
          { key: 'client', label: 'Client' },
          { key: 'date', label: 'Date', className: 'font-mono whitespace-nowrap' },
          { key: 'issue', label: 'Issue' },
          { key: 'age', label: 'Waiting (hrs)', align: 'right', className: 'tabular-nums' },
        ],
        rows: opsPendingRegularizations(scope).map((r) => ({
          emp: r.employee,
          code: r.empCode,
          client: r.client,
          date: r.date,
          issue: r.issueType,
          age: r.ageHours,
        })),
      };
    case 'compliance': {
      const names = nameById(allCandidates);
      const uan = opsPendingUan(scope).map((r) => ({
        item: 'UAN not registered',
        who: names.get(r.candidateId) ?? r.candidateId,
        detail: 'Candidate still without a UAN',
      }));
      const esic = opsEsicDuplicates(scope).map(({ row, message }) => ({
        item: 'ESIC duplicate',
        who: row.employeeName,
        detail: message,
      }));
      return {
        title: 'Compliance items open',
        columns: [
          { key: 'item', label: 'Item', className: 'font-semibold whitespace-nowrap' },
          { key: 'who', label: 'Candidate / Employee' },
          { key: 'detail', label: 'Detail' },
        ],
        rows: [...uan, ...esic],
      };
    }
    case 'exit-docs': {
      const label = new Map(EXIT_DOC_TYPES.map((d) => [d.id, d.label]));
      return {
        title: 'Exit documents pending',
        columns: [
          { key: 'emp', label: 'Employee', className: 'font-semibold whitespace-nowrap' },
          { key: 'code', label: 'Emp Code', className: 'font-mono whitespace-nowrap' },
          { key: 'client', label: 'Client' },
          { key: 'type', label: 'Exit Type' },
          { key: 'missing', label: 'Missing Documents' },
        ],
        rows: opsExitDocCases(scope).map(({ exit: ec, missing }) => ({
          emp: ec.employee,
          code: ec.empCode,
          client: ec.client,
          type: ec.exitType,
          missing: missing.map((m) => label.get(m) ?? m).join(', '),
        })),
      };
    }
  }
};
