import { DASHBOARD_REFERENCE_DATE } from '../modules/dashboard/dashboard.metrics';

export type ClosureStatus = 'Active' | 'Closure initiated' | 'Experience letter generated';
export type ContractSource = 'Offer letter' | 'Extension letter' | 'Candidate record';

export interface ContractRecord {
  id: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  clientName: string;
  pocName: string;
  pocEmail: string;
  startDate: string;
  /** End date auto-populated from the latest offer letter. */
  autoEndDate: string;
  /** Source letter title the auto date came from. */
  sourceLetter: string;
  /** Latest extension letter (overrides the offer-letter date when present). */
  extension?: { title: string; issuedDate: string; newEndDate: string };
  /** Manual correction; both this and the auto value are kept. */
  manual?: { endDate: string; reason: string; by: string; at: string };
  intimationSentAt?: string;
  reminderAckedAt?: string;
  closureStatus: ClosureStatus;
  closureAt?: string;
}

const DAY = 86_400_000;
const toMs = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

export const addDays = (iso: string, n: number): string => new Date(toMs(iso) + n * DAY).toISOString().slice(0, 10);

export const addMonths = (iso: string, n: number): string => {
  const d = new Date(toMs(iso));
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (fromIso: string, toIso: string): number => Math.round((toMs(toIso) - toMs(fromIso)) / DAY);

export const formatContractDate = (iso: string): string =>
  new Date(toMs(iso)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Effective end date: manual correction wins, then extension letter, then the offer letter. */
export const effectiveEndDate = (c: ContractRecord): string => c.manual?.endDate ?? c.extension?.newEndDate ?? c.autoEndDate;

/** The system-derived end date (ignoring any manual correction). */
export const systemEndDate = (c: ContractRecord): string => c.extension?.newEndDate ?? c.autoEndDate;

export const CLIENT_POCS: Record<string, { name: string; email: string }> = {
  'Tata Consultancy Services': { name: 'Meera Iyer', email: 'meera.iyer@tcs.example.com' },
  'Infosys Technologies': { name: 'Rahul Menon', email: 'rahul.menon@infosys.example.com' },
  'HDFC Bank Ltd': { name: 'Sunita Kapoor', email: 'sunita.kapoor@hdfcbank.example.com' },
  'Flipkart Internet Pvt Ltd': { name: 'Aditya Rao', email: 'aditya.rao@flipkart.example.com' },
  'Larsen & Toubro Ltd': { name: 'Vikram Desai', email: 'vikram.desai@lnt.example.com' },
  'Wipro Digital': { name: 'Neha Bhatt', email: 'neha.bhatt@wipro.example.com' },
  'Reliance Retail Ltd': { name: 'Prakash Joshi', email: 'prakash.joshi@ril.example.com' },
};

export const CLIENT_POC_FALLBACK = { name: 'Client POC', email: 'poc@client.example.com' };

const R = DASHBOARD_REFERENCE_DATE;

const seed = (
  n: number,
  employeeName: string,
  designation: string,
  clientName: string,
  daysLeftValue: number,
  extra: Partial<ContractRecord> = {}
): ContractRecord => {
  const end = addDays(R, daysLeftValue);
  const poc = CLIENT_POCS[clientName] ?? CLIENT_POC_FALLBACK;
  return {
    id: `CT-${1000 + n}`,
    employeeName,
    employeeCode: `2C-EMP-${2100 + n}`,
    designation,
    clientName,
    pocName: poc.name,
    pocEmail: poc.email,
    startDate: addMonths(addDays(end, 1), -12),
    autoEndDate: end,
    sourceLetter: `Offer Letter - ${clientName.split(' ')[0]} Deputation`,
    closureStatus: 'Active',
    ...extra,
  };
};

export const MOCK_CONTRACTS: ContractRecord[] = [
  seed(1, 'Ananya Krishnan', 'Software Engineer', 'Tata Consultancy Services', 3),
  seed(2, 'Rohan Deshmukh', 'Relationship Executive', 'HDFC Bank Ltd', 9, { intimationSentAt: `${addDays(R, -4)}T11:20:00` }),
  seed(3, 'Priya Nambiar', 'QA Analyst', 'Infosys Technologies', 14),
  seed(4, 'Mohammed Faizan', 'Warehouse Associate', 'Flipkart Internet Pvt Ltd', 22),
  seed(5, 'Sneha Patil', 'Site Supervisor', 'Larsen & Toubro Ltd', 6, {
    intimationSentAt: `${addDays(R, -10)}T10:05:00`,
    closureStatus: 'Closure initiated',
    closureAt: `${addDays(R, -1)}T15:40:00`,
  }),
  seed(6, 'Karthik Subramanian', 'Data Analyst', 'Wipro Digital', 28, {
    autoEndDate: addDays(R, -152),
    startDate: addMonths(addDays(R, -151), -12),
    extension: { title: 'Extension Letter - 6 months', issuedDate: addDays(R, -12), newEndDate: addDays(R, 28) },
  }),
  seed(7, 'Divya Chauhan', 'Store Manager', 'Reliance Retail Ltd', 31),
  seed(8, 'Arjun Malhotra', 'Credit Analyst', 'HDFC Bank Ltd', 34),
  seed(9, 'Lakshmi Venkatesh', 'Support Engineer', 'Infosys Technologies', 40, {
    autoEndDate: addDays(R, 33),
    manual: {
      endDate: addDays(R, 40),
      reason: 'Client confirmed project handover date differs from offer letter',
      by: 'Ananya (Ops Lead)',
      at: `${addDays(R, -3)}T16:10:00`,
    },
  }),
  seed(10, 'Imran Sheikh', 'Logistics Coordinator', 'Flipkart Internet Pvt Ltd', 52),
  seed(11, 'Pooja Reddy', 'Civil Engineer', 'Larsen & Toubro Ltd', 58),
  seed(12, 'Siddharth Jain', 'Business Analyst', 'Tata Consultancy Services', 75),
  seed(13, 'Nisha Thomas', 'Sales Associate', 'Reliance Retail Ltd', 120),
  seed(14, 'Gaurav Mishra', 'DevOps Engineer', 'Wipro Digital', 210),
  seed(16, 'Aarti Bhosale', 'Process Associate', 'Reliance Retail Ltd', 11, { intimationSentAt: `${addDays(R, -6)}T10:30:00` }),
  seed(17, 'Vivek Nambiar', 'Java Developer', 'Tata Consultancy Services', 17),
  seed(18, 'Shweta Rao', 'Credit Officer', 'HDFC Bank Ltd', 25),
  seed(19, 'Tarun Bajaj', 'Supply Planner', 'Flipkart Internet Pvt Ltd', 38),
  seed(20, 'Mehul Shah', 'QA Engineer', 'Wipro Digital', 46),
  seed(21, 'Rina Dutta', 'Site Engineer', 'Larsen & Toubro Ltd', 63),
  seed(22, 'Kabir Anand', 'Cloud Engineer', 'Infosys Technologies', 70),
  seed(23, 'Sunita Pawar', 'Store Supervisor', 'Reliance Retail Ltd', 88),
  seed(24, 'Yash Trivedi', 'Data Engineer', 'Tata Consultancy Services', 104),
  seed(25, 'Bhavna Kohli', 'Relationship Manager', 'HDFC Bank Ltd', 140),
  seed(15, 'Farah Khan', 'Back Office Executive', 'HDFC Bank Ltd', -5, {
    intimationSentAt: `${addDays(R, -36)}T10:00:00`,
    closureStatus: 'Experience letter generated',
    closureAt: `${addDays(R, -4)}T12:30:00`,
  }),
];

export const daysLeft = (c: ContractRecord, refDate: string): number => daysBetween(refDate, effectiveEndDate(c));

export const isClosed = (c: ContractRecord) => c.closureStatus === 'Experience letter generated';

/** Contracts not yet closed that expire within `withinDays` days after `refDate` (initial mock state). */
export const expiringContractCount = (withinDays: number, refDate: string): number =>
  MOCK_CONTRACTS.filter((c) => {
    const d = daysLeft(c, refDate);
    return !isClosed(c) && d >= 0 && d <= withinDays;
  }).length;

/** Contracts inside the 30-day intimation window with no client intimation sent yet. */
export const contractsNeedingClientIntimationCount = (refDate: string): number =>
  MOCK_CONTRACTS.filter((c) => {
    const d = daysLeft(c, refDate);
    return !isClosed(c) && d >= 0 && d <= 30 && !c.intimationSentAt;
  }).length;

export type CallOutcome = 'Connected' | 'No answer' | 'Callback';
export type WorkflowId = 'extension' | 'closure';

export interface CallWorkflow {
  id: WorkflowId;
  name: string;
  description: string;
  /** Days before expiry on which a call is triggered (highest first). */
  triggerDays: number[];
  script: string;
  maxAttempts: number;
  retryAfterHours: number;
  enabled: boolean;
}

export interface CallLogRow {
  id: string;
  contractId: string;
  employeeName: string;
  workflow: WorkflowId;
  attempt: number;
  outcome: CallOutcome;
  /** 'yyyy-mm-dd HH:mm' */
  at: string;
}

export const MOCK_WORKFLOWS: CallWorkflow[] = [
  {
    id: 'extension',
    name: 'Contract extension call',
    description: 'Calls the client POC to confirm whether the contract will be extended.',
    triggerDays: [45, 35],
    script:
      'Hello {{poc_name}}, this is the 2COMS automated assistant. The contract of {{employee_name}} with {{client_name}} ends on {{contract_end_date}}, {{days_left}} days from today. Press 1 to confirm an extension, press 2 to decline, or press 3 to request a callback from your HR partner.',
    maxAttempts: 3,
    retryAfterHours: 24,
    enabled: true,
  },
  {
    id: 'closure',
    name: 'Contract closure call',
    description: 'Calls the client POC to schedule closure formalities and the experience letter.',
    triggerDays: [30, 7],
    script:
      'Hello {{poc_name}}, the contract of {{employee_name}} ends on {{contract_end_date}}. As no extension has been received, 2COMS will initiate contract closure and issue the experience letter. Press 1 to acknowledge, or press 3 to request a callback.',
    maxAttempts: 2,
    retryAfterHours: 12,
    enabled: true,
  },
];

const log = (
  n: number,
  contractId: string,
  employeeName: string,
  workflow: WorkflowId,
  attempt: number,
  outcome: CallOutcome,
  day: number,
  time: string
): CallLogRow => ({ id: `CALL-${n}`, contractId, employeeName, workflow, attempt, outcome, at: `${addDays(R, day)} ${time}` });

export const MOCK_CALL_LOG: CallLogRow[] = [
  log(8, 'CT-1001', 'Ananya Krishnan', 'closure', 1, 'No answer', 0, '10:15'),
  log(7, 'CT-1002', 'Rohan Deshmukh', 'closure', 1, 'Connected', 0, '09:40'),
  log(6, 'CT-1003', 'Priya Nambiar', 'extension', 2, 'Callback', 0, '09:05'),
  log(5, 'CT-1001', 'Ananya Krishnan', 'extension', 3, 'Connected', -1, '16:30'),
  log(4, 'CT-1004', 'Mohammed Faizan', 'extension', 1, 'No answer', -1, '11:10'),
  log(3, 'CT-1006', 'Karthik Subramanian', 'extension', 1, 'Connected', -3, '10:00'),
  log(2, 'CT-1005', 'Sneha Patil', 'closure', 1, 'Connected', -4, '14:25'),
  log(1, 'CT-1008', 'Arjun Malhotra', 'extension', 1, 'Callback', -5, '12:45'),
];

export const INTIMATION_TEMPLATE = {
  subject: 'Contract expiry intimation: {{employee_name}} ({{employee_code}}) ends on {{contract_end_date}}',
  body: `Dear {{poc_name}},

This is to inform you that the contract of {{employee_name}} ({{employee_code}}), {{designation}} deployed with {{client_name}}, is due to end on {{contract_end_date}} ({{days_left}} days from today).

Please let us know by reply to this email whether you would like to:
1. Extend the contract (we will issue an Extension Letter), or
2. Close the contract (we will process closure and issue the Experience Letter).

If we do not hear from you, the contract will be closed on the end date as per the offer letter.

Regards,
Onboarding Team, 2COMS Consulting`,
};

export const TEMPLATE_VARIABLES = ['poc_name', 'employee_name', 'employee_code', 'designation', 'client_name', 'contract_end_date', 'days_left'];

export const fillTemplate = (text: string, vars: Record<string, string>): string =>
  text.replace(/\{\{(\w+)\}\}/g, (m, k: string) => vars[k] ?? m);
