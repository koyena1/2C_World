/** Mock data for Compliance -> Insurance (client-wise plans and enrolment). Frontend simulation only. */
import type { Candidate } from '../types/onboarding';
import { DASHBOARD_REFERENCE_DATE } from '../modules/dashboard/dashboard.metrics';

export type PlanType = 'GMC' | 'GPA' | 'WC';
export const PLAN_TYPE_LABEL: Record<PlanType, string> = {
  GMC: 'Group Medical (GMC)',
  GPA: 'Group Personal Accident (GPA)',
  WC: "Workmen's Compensation (WC)",
};

export interface InsurancePlan {
  id: string;
  client: string;
  type: PlanType;
  name: string;
  insurer: string;
  tpa: string;
  policyNo: string;
  /** Sum insured per employee, Rs. */
  sumInsured: number;
  /** Annual premium per employee, Rs. */
  premium: number;
  /** Share of premium paid by the employer, 0-100. The rest is deducted from the employee. */
  employerSharePct: number;
  spouseCovered: boolean;
  childrenCovered: number;
  parentsCovered: boolean;
  policyStart: string;
  policyEnd: string;
}

export type EnrolStatus = 'Enrolled' | 'Pending' | 'Opted-out';
export const ENROL_STATUSES: EnrolStatus[] = ['Enrolled', 'Pending', 'Opted-out'];
export const DEPENDANT_RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother'] as const;

export interface Dependant {
  id: string;
  name: string;
  relation: string;
  dob: string;
}

export interface Enrolment {
  id: string;
  candidateId: string;
  planId: string;
  status: EnrolStatus;
  dependants: Dependant[];
  enrolledOn?: string;
  optOutReason?: string;
  updatedBy: string;
}

export const INSURERS = ['ICICI Lombard', 'Star Health', 'New India Assurance', 'HDFC Ergo', 'Bajaj Allianz', 'Tata AIG'];
export const TPAS = ['Medi Assist', 'Paramount Health', 'Vidal Health', 'Raksha TPA', 'Direct (no TPA)'];

export const INITIAL_PLANS: InsurancePlan[] = [
  { id: 'PLN-01', client: 'Tata Consultancy Services', type: 'GMC', name: 'TCS Associate Medical Cover', insurer: 'ICICI Lombard', tpa: 'Medi Assist', policyNo: 'GMC/4012/2026/0418', sumInsured: 500000, premium: 9800, employerSharePct: 100, spouseCovered: true, childrenCovered: 2, parentsCovered: false, policyStart: '2026-04-01', policyEnd: '2027-03-31' },
  { id: 'PLN-02', client: 'Tata Consultancy Services', type: 'GPA', name: 'TCS Accident Cover', insurer: 'New India Assurance', tpa: 'Direct (no TPA)', policyNo: 'GPA/1180/2026/0099', sumInsured: 1000000, premium: 1450, employerSharePct: 100, spouseCovered: false, childrenCovered: 0, parentsCovered: false, policyStart: '2026-04-01', policyEnd: '2027-03-31' },
  { id: 'PLN-03', client: 'Infosys Technologies', type: 'GMC', name: 'Infosys Family Floater', insurer: 'Star Health', tpa: 'Paramount Health', policyNo: 'GMC/7733/2026/0231', sumInsured: 700000, premium: 12400, employerSharePct: 80, spouseCovered: true, childrenCovered: 2, parentsCovered: true, policyStart: '2025-11-01', policyEnd: '2026-10-31' },
  { id: 'PLN-04', client: 'HDFC Bank Ltd', type: 'GMC', name: 'HDFC Staff Mediclaim', insurer: 'HDFC Ergo', tpa: 'Vidal Health', policyNo: 'GMC/2290/2026/0777', sumInsured: 400000, premium: 8600, employerSharePct: 70, spouseCovered: true, childrenCovered: 2, parentsCovered: false, policyStart: '2026-07-01', policyEnd: '2027-06-30' },
  { id: 'PLN-05', client: 'HDFC Bank Ltd', type: 'GPA', name: 'HDFC Personal Accident', insurer: 'Bajaj Allianz', tpa: 'Direct (no TPA)', policyNo: 'GPA/3345/2026/0512', sumInsured: 1500000, premium: 1900, employerSharePct: 100, spouseCovered: false, childrenCovered: 0, parentsCovered: false, policyStart: '2026-07-01', policyEnd: '2027-06-30' },
  { id: 'PLN-06', client: 'Flipkart Internet Pvt Ltd', type: 'GMC', name: 'Flipkart Wellness Plus', insurer: 'Star Health', tpa: 'Medi Assist', policyNo: 'GMC/6601/2026/0345', sumInsured: 500000, premium: 10200, employerSharePct: 90, spouseCovered: true, childrenCovered: 3, parentsCovered: true, policyStart: '2026-01-01', policyEnd: '2026-12-31' },
  { id: 'PLN-07', client: 'Flipkart Internet Pvt Ltd', type: 'WC', name: 'Warehouse Workmen Compensation', insurer: 'Tata AIG', tpa: 'Direct (no TPA)', policyNo: 'WC/5520/2026/0061', sumInsured: 800000, premium: 2200, employerSharePct: 100, spouseCovered: false, childrenCovered: 0, parentsCovered: false, policyStart: '2026-01-01', policyEnd: '2026-12-31' },
  { id: 'PLN-08', client: 'Larsen & Toubro Ltd', type: 'WC', name: 'Site Workmen Compensation', insurer: 'New India Assurance', tpa: 'Direct (no TPA)', policyNo: 'WC/8870/2026/0140', sumInsured: 1200000, premium: 3100, employerSharePct: 100, spouseCovered: false, childrenCovered: 0, parentsCovered: false, policyStart: '2026-05-01', policyEnd: '2027-04-30' },
  { id: 'PLN-09', client: 'Larsen & Toubro Ltd', type: 'GMC', name: 'L&T Group Mediclaim', insurer: 'ICICI Lombard', tpa: 'Raksha TPA', policyNo: 'GMC/1009/2026/0602', sumInsured: 500000, premium: 9100, employerSharePct: 75, spouseCovered: true, childrenCovered: 2, parentsCovered: true, policyStart: '2026-05-01', policyEnd: '2027-04-30' },
  { id: 'PLN-10', client: 'Wipro Digital', type: 'GMC', name: 'Wipro Digital Health Cover', insurer: 'Bajaj Allianz', tpa: 'Paramount Health', policyNo: 'GMC/9042/2026/0188', sumInsured: 600000, premium: 11000, employerSharePct: 85, spouseCovered: true, childrenCovered: 2, parentsCovered: false, policyStart: '2026-03-01', policyEnd: '2027-02-28' },
  { id: 'PLN-11', client: 'Reliance Retail Ltd', type: 'GMC', name: 'Reliance Retail Staff Cover', insurer: 'New India Assurance', tpa: 'Vidal Health', policyNo: 'GMC/3118/2026/0925', sumInsured: 300000, premium: 6400, employerSharePct: 60, spouseCovered: true, childrenCovered: 2, parentsCovered: false, policyStart: '2026-04-01', policyEnd: '2027-03-31' },
  { id: 'PLN-12', client: 'Reliance Retail Ltd', type: 'WC', name: 'Store Workmen Compensation', insurer: 'Tata AIG', tpa: 'Direct (no TPA)', policyNo: 'WC/4417/2026/0309', sumInsured: 700000, premium: 1800, employerSharePct: 100, spouseCovered: false, childrenCovered: 0, parentsCovered: false, policyStart: '2026-04-01', policyEnd: '2027-03-31' },
];

export type PolicyHealth = 'Active' | 'Expiring soon' | 'Expired';
export const EXPIRY_WARNING_DAYS = 45;

/** Policy status relative to the fixed "today" of the app. */
export const policyHealth = (plan: Pick<InsurancePlan, 'policyEnd'>): { status: PolicyHealth; daysLeft: number } => {
  const daysLeft = Math.round((Date.parse(plan.policyEnd) - Date.parse(DASHBOARD_REFERENCE_DATE)) / 86400000);
  return { daysLeft, status: daysLeft < 0 ? 'Expired' : daysLeft <= EXPIRY_WARNING_DAYS ? 'Expiring soon' : 'Active' };
};

/** Employee and employer share of the annual premium, in Rs. */
export const premiumSplit = (plan: Pick<InsurancePlan, 'premium' | 'employerSharePct'>) => {
  const employer = Math.round((plan.premium * plan.employerSharePct) / 100);
  return { employer, employee: plan.premium - employer };
};

const fullName = (c: Candidate) => `${c.firstName} ${c.lastName}`.trim();
const dependantsFor = (c: Candidate, plan: InsurancePlan, seed: number): Dependant[] => {
  const out: Dependant[] = [];
  if (plan.spouseCovered && c.maritalStatus === 'Married' && c.spouseName) {
    out.push({ id: `${c.id}-sp`, name: c.spouseName, relation: 'Spouse', dob: `199${seed % 10}-0${(seed % 9) + 1}-1${seed % 9}` });
  }
  if (plan.parentsCovered && c.fatherName) out.push({ id: `${c.id}-fa`, name: c.fatherName, relation: 'Father', dob: '1962-08-21' });
  if (plan.parentsCovered && c.motherName && seed % 2 === 0) out.push({ id: `${c.id}-mo`, name: c.motherName, relation: 'Mother', dob: '1965-02-09' });
  return out;
};

const PATTERN: EnrolStatus[] = ['Enrolled', 'Enrolled', 'Pending', 'Enrolled', 'Opted-out', 'Enrolled', 'Pending', 'Enrolled'];
const OPT_OUT_REASONS = ['Already covered under spouse\'s company policy', 'Has a personal family floater policy'];

/** Deterministic starting enrolments: every candidate of a client against the client's plans, with a few left out. */
export const buildInitialEnrolments = (candidates: Candidate[]): Enrolment[] => {
  const out: Enrolment[] = [];
  candidates.forEach((c, ci) => {
    INITIAL_PLANS.filter((p) => p.client === c.clientName).forEach((plan, pi) => {
      const n = ci * 3 + pi;
      if (n % 9 === 7) return; // not yet enrolled: appears in the Enrol dialog
      const status = plan.type === 'WC' ? (n % 5 === 0 ? 'Pending' : 'Enrolled') : PATTERN[n % PATTERN.length];
      out.push({
        id: `ENR-${c.id}-${plan.id}`,
        candidateId: c.id,
        planId: plan.id,
        status,
        dependants: status === 'Opted-out' ? [] : dependantsFor(c, plan, n),
        enrolledOn: status === 'Enrolled' ? c.dateOfJoining || DASHBOARD_REFERENCE_DATE : undefined,
        optOutReason: status === 'Opted-out' ? OPT_OUT_REASONS[n % 2] : undefined,
        updatedBy: 'Priya Nair',
      });
    });
  });
  return out;
};

export const candidateLabel = fullName;
