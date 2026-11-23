import type { Candidate } from '../types/onboarding';
import { DASHBOARD_REFERENCE_DATE } from '../modules/dashboard/dashboard.metrics';

export type VariableGroup = 'Candidate' | 'Employment' | 'Compensation' | 'Client' | 'Dates';
export const VARIABLE_GROUPS: VariableGroup[] = ['Candidate', 'Employment', 'Compensation', 'Client', 'Dates'];

export interface LetterVariable {
  key: string;
  label: string;
  group: VariableGroup;
  /** Flagged "New" in the palette (requirement 4: LWD was missing). */
  isNew?: boolean;
  /** Returns the sample value for a candidate, or undefined when that candidate has no such data. */
  resolve: (c: Candidate) => string | undefined;
}

export const formatLetterDate = (iso?: string): string | undefined => {
  if (!iso) return undefined;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const inr = (n: number) => `INR ${n.toLocaleString('en-IN')}`;

export const LETTER_VARIABLES: LetterVariable[] = [
  { key: 'candidate_name', label: 'Candidate Full Name', group: 'Candidate', resolve: (c) => `${c.firstName} ${c.lastName}` },
  { key: 'candidate_email', label: 'Candidate Email', group: 'Candidate', resolve: (c) => c.email },
  { key: 'candidate_phone', label: 'Candidate Phone', group: 'Candidate', resolve: (c) => c.phone },
  { key: 'candidate_id', label: 'Candidate ID', group: 'Candidate', resolve: (c) => c.userId },
  { key: 'designation', label: 'Designation', group: 'Employment', resolve: (c) => c.designation },
  { key: 'department', label: 'Department', group: 'Employment', resolve: (c) => c.department },
  { key: 'work_location', label: 'Work Location', group: 'Employment', resolve: (c) => c.workLocation },
  { key: 'employee_code', label: 'Client Employee Code', group: 'Employment', resolve: (c) => c.clientCandidateCode },
  { key: 'gross_monthly', label: 'Gross Monthly Salary', group: 'Compensation', resolve: (c) => inr(c.grossSalaryMonthly) },
  { key: 'annual_ctc', label: 'Annual CTC', group: 'Compensation', resolve: (c) => inr(c.grossSalaryMonthly * 12) },
  { key: 'revised_monthly', label: 'Revised Monthly Salary (10% hike)', group: 'Compensation', resolve: (c) => inr(Math.round(c.grossSalaryMonthly * 1.1)) },
  { key: 'client_name', label: 'Client Name', group: 'Client', resolve: (c) => c.clientName },
  { key: 'recruiter_name', label: 'Recruiter Name', group: 'Client', resolve: (c) => c.recruiterName },
  { key: 'letter_date', label: 'Letter Date', group: 'Dates', resolve: () => formatLetterDate(DASHBOARD_REFERENCE_DATE) },
  { key: 'date_of_joining', label: 'Date of Joining', group: 'Dates', resolve: (c) => formatLetterDate(c.dateOfJoining) },
  { key: 'contract_end_date', label: 'Contract End Date', group: 'Dates', resolve: (c) => formatLetterDate(c.endOfContract) },
  { key: 'last_working_day', label: 'Last Working Day (LWD)', group: 'Dates', isNew: true, resolve: (c) => formatLetterDate(c.endOfContract) },
];

export interface LetterTemplate {
  id: string;
  name: string;
  type: 'Offer' | 'Extension' | 'Hike' | 'Relieving' | 'Experience' | 'Termination';
  body: string;
  updatedBy: string;
  updatedAt: string;
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'tpl-offer', name: 'Offer Letter', type: 'Offer', updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-09-18T11:20:00.000Z',
    body: `Date: {{letter_date}}\n\nDear {{candidate_name}},\n\nWe are pleased to offer you the position of {{designation}} ({{department}}) with {{client_name}}, on the payroll of 2COMS. Your place of work will be {{work_location}} and your date of joining is {{date_of_joining}}.\n\nYour gross monthly salary will be {{gross_monthly}} (annual CTC {{annual_ctc}}). Please sign and return this letter to confirm your acceptance.\n\nRegards,\n{{recruiter_name}}\nTalent Acquisition, 2COMS`,
  },
  {
    id: 'tpl-extension', name: 'Contract Extension Letter', type: 'Extension', updatedBy: 'Vikram (Client HR)', updatedAt: '2026-09-02T09:05:00.000Z',
    body: `Date: {{letter_date}}\n\nDear {{candidate_name}},\n\nYour current assignment as {{designation}} with {{client_name}} ends on {{contract_end_date}}. We are happy to extend your engagement; the terms stay unchanged at {{gross_monthly}} per month.\n\nPlease acknowledge this letter to accept the extension.\n\nRegards,\n{{recruiter_name}}\n2COMS`,
  },
  {
    id: 'tpl-hike', name: 'Salary Hike Letter', type: 'Hike', updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-08-27T15:40:00.000Z',
    body: `Date: {{letter_date}}\n\nDear {{candidate_name}},\n\nIn recognition of your performance as {{designation}} at {{client_name}}, your gross monthly salary is revised from {{gross_monthly}} to {{revised_monthly}}.\n\nRegards,\n{{recruiter_name}}\n2COMS`,
  },
  {
    id: 'tpl-relieving', name: 'Relieving Letter', type: 'Relieving', updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-08-11T10:00:00.000Z',
    body: `Date: {{letter_date}}\n\nTo whom it may concern,\n\nThis is to certify that {{candidate_name}} ({{candidate_id}}) has been relieved from the services of 2COMS, deployed at {{client_name}}, with effect from the close of business on {{last_working_day}}.\n\nWe wish {{candidate_name}} the very best.\n\nRegards,\nHR Operations, 2COMS`,
  },
  {
    id: 'tpl-experience', name: 'Experience Letter', type: 'Experience', updatedBy: 'Vikram (Client HR)', updatedAt: '2026-08-11T10:12:00.000Z',
    body: `Date: {{letter_date}}\n\nThis is to certify that {{candidate_name}} worked with 2COMS as {{designation}} at {{client_name}} from {{date_of_joining}} to {{last_working_day}}. Conduct and performance during this period were satisfactory.\n\nRegards,\nHR Operations, 2COMS`,
  },
  {
    id: 'tpl-termination', name: 'Termination Letter', type: 'Termination', updatedBy: 'Ananya (Ops Lead)', updatedAt: '2026-07-30T13:25:00.000Z',
    body: `Date: {{letter_date}}\n\nDear {{candidate_name}},\n\nWith reference to your engagement as {{designation}} at {{client_name}}, we regret to inform you that your services are terminated. Your last working day will be {{last_working_day}}. Full and final settlement will follow as per policy.\n\nRegards,\nHR Operations, 2COMS`,
  },
];

export interface LetterApproval {
  id: string;
  candidateId: string;
  type: 'Offer' | 'Extension' | 'Hike';
  issuedOn: string;
  status: 'Awaiting employee approval' | 'Approved' | 'Rejected' | 'Expired';
  approvedAt?: string;
  signatureApplied: boolean;
}

export const LETTER_APPROVALS: LetterApproval[] = [
  { id: 'LA-1001', candidateId: 'cand-001', type: 'Offer', issuedOn: '2026-09-20', status: 'Approved', approvedAt: '2026-09-22T10:50:00.000Z', signatureApplied: true },
  { id: 'LA-1002', candidateId: 'cand-001', type: 'Hike', issuedOn: '2026-10-01', status: 'Awaiting employee approval', signatureApplied: false },
  { id: 'LA-1003', candidateId: 'cand-002', type: 'Offer', issuedOn: '2026-09-22', status: 'Approved', approvedAt: '2026-09-24T14:10:00.000Z', signatureApplied: true },
  { id: 'LA-1004', candidateId: 'cand-003', type: 'Offer', issuedOn: '2026-09-10', status: 'Approved', approvedAt: '2026-09-12T08:30:00.000Z', signatureApplied: false },
  { id: 'LA-1005', candidateId: 'cand-004', type: 'Offer', issuedOn: '2026-09-29', status: 'Awaiting employee approval', signatureApplied: false },
  { id: 'LA-1006', candidateId: 'cand-005', type: 'Extension', issuedOn: '2026-09-26', status: 'Awaiting employee approval', signatureApplied: false },
  { id: 'LA-1007', candidateId: 'cand-006', type: 'Extension', issuedOn: '2026-09-14', status: 'Approved', approvedAt: '2026-09-15T12:00:00.000Z', signatureApplied: true },
  { id: 'LA-1008', candidateId: 'cand-007', type: 'Offer', issuedOn: '2026-08-28', status: 'Expired', signatureApplied: false },
  { id: 'LA-1009', candidateId: 'cand-008', type: 'Hike', issuedOn: '2026-09-18', status: 'Rejected', signatureApplied: false },
  { id: 'LA-1010', candidateId: 'cand-010', type: 'Offer', issuedOn: '2026-10-02', status: 'Awaiting employee approval', signatureApplied: false },
  { id: 'LA-1011', candidateId: 'cand-012', type: 'Hike', issuedOn: '2026-09-30', status: 'Awaiting employee approval', signatureApplied: false },
  { id: 'LA-1012', candidateId: 'cand-013', type: 'Extension', issuedOn: '2026-09-05', status: 'Approved', approvedAt: '2026-09-07T09:40:00.000Z', signatureApplied: false },
];
