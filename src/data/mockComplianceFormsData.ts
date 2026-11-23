/** Mock data for Compliance -> Forms (digital replication of statutory forms). Frontend simulation only. */
import type { Candidate } from '../types/onboarding';
import { DASHBOARD_REFERENCE_DATE } from '../modules/dashboard/dashboard.metrics';

export type FormStatus = 'Not started' | 'Draft' | 'Submitted' | 'Verified' | 'Returned';
export const FORM_STATUSES: FormStatus[] = ['Not started', 'Draft', 'Submitted', 'Verified', 'Returned'];

export type FormFieldType = 'text' | 'date' | 'number' | 'textarea' | 'select';

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[];
  pattern?: RegExp;
  patternMsg?: string;
  placeholder?: string;
  /** Spans the whole row on wide screens. */
  full?: boolean;
  /** Value copied from the candidate's profile. */
  prefill?: (c: Candidate) => string;
  /** Used for seeded, already-submitted forms when the profile has no value. */
  sample?: string;
}

export interface FormSection {
  title: string;
  note?: string;
  fields: FormField[];
}

export interface FormDef {
  id: string;
  code: string;
  name: string;
  authority: string;
  summary: string;
  sections: FormSection[];
  appliesTo: (c: Candidate) => boolean;
  appliesNote: string;
  declaration: string;
  /** Cross-field checks. Returns { fieldKey: message }. */
  validate?: (values: Record<string, string>) => Record<string, string>;
}

const fullName = (c: Candidate) => `${c.firstName} ${c.lastName}`.trim();
const digits10 = (c: Candidate) => c.phone.replace(/\D/g, '').slice(-10);
const CITY_STATE: Record<string, string> = {
  Pune: 'Maharashtra',
  Mumbai: 'Maharashtra',
  Bangalore: 'Karnataka',
  Hyderabad: 'Telangana',
  Chennai: 'Tamil Nadu',
  Gurgaon: 'Haryana',
  Kolkata: 'West Bengal',
  Kochi: 'Kerala',
};
const stateOf = (c: Candidate) => {
  const s = CITY_STATE[c.workLocation.split(' - ')[0].trim()];
  return s === 'Haryana' ? 'Other' : s ?? 'Other';
};
const PT_STATES = ['Maharashtra', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Kerala', 'Other'];
const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister'];
const YES_NO = ['Yes', 'No'];
const AADHAAR = /^\d{4}\s?\d{4}\s?\d{4}$/;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;

export const FORM_DEFS: FormDef[] = [
  {
    id: 'pf-form-11',
    code: 'EPF Form 11',
    name: 'PF Declaration Form (Form 11)',
    authority: 'EPFO',
    summary: 'New-joiner declaration for Provident Fund membership and previous PF history.',
    appliesNote: 'Every new joiner',
    appliesTo: () => true,
    declaration: 'I certify that the particulars above are true to the best of my knowledge and I will inform the employer of any change.',
    sections: [
      {
        title: 'A. Member details',
        fields: [
          { key: 'name', label: 'Name of member', type: 'text', required: true, prefill: fullName },
          { key: 'fatherSpouse', label: "Father's / Spouse's name", type: 'text', required: true, prefill: (c) => c.fatherName, sample: 'Suresh Kumar' },
          { key: 'dob', label: 'Date of birth', type: 'date', required: true, prefill: (c) => c.dob },
          { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true, prefill: (c) => c.gender },
          { key: 'marital', label: 'Marital status', type: 'select', options: ['Single', 'Married', 'Other'], required: true, prefill: (c) => c.maritalStatus },
          { key: 'mobile', label: 'Mobile number', type: 'text', required: true, pattern: /^\d{10}$/, patternMsg: 'Enter a 10-digit mobile number.', prefill: digits10 },
          { key: 'email', label: 'Email', type: 'text', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Enter a valid email address.', prefill: (c) => c.email },
        ],
      },
      {
        title: 'B. Previous PF membership',
        fields: [
          { key: 'earlier', label: 'Was a member of EPF earlier?', type: 'select', options: YES_NO, required: true, sample: 'No' },
          { key: 'prevUan', label: 'Previous UAN (if yes)', type: 'text', pattern: /^\d{12}$/, patternMsg: 'UAN has 12 digits.', placeholder: '12-digit UAN' },
          { key: 'prevExit', label: 'Date of exit from previous employment', type: 'date' },
        ],
      },
      {
        title: 'C. KYC and bank details',
        fields: [
          { key: 'aadhaar', label: 'Aadhaar number', type: 'text', required: true, pattern: AADHAAR, patternMsg: 'Aadhaar has 12 digits.', sample: '4521 7788 9012' },
          { key: 'pan', label: 'PAN', type: 'text', required: true, pattern: PAN, patternMsg: 'PAN looks like ABCDE1234F.', sample: 'BQRPK4821M' },
          { key: 'account', label: 'Bank account number', type: 'text', required: true, prefill: (c) => c.accountNumber },
          { key: 'ifsc', label: 'IFSC', type: 'text', required: true, pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, patternMsg: 'IFSC looks like HDFC0001234.', prefill: (c) => c.ifscCode },
        ],
      },
    ],
    validate: (v): Record<string, string> => (v.earlier === 'Yes' && !v.prevUan?.trim() ? { prevUan: 'Enter the previous UAN because you were an EPF member earlier.' } : {}),
  },
  {
    id: 'pf-nomination',
    code: 'EPF Form 2',
    name: 'PF Nomination Form (Form 2)',
    authority: 'EPFO',
    summary: 'Nominee details for PF, pension and insurance benefits, with share of each nominee.',
    appliesNote: 'Every new joiner',
    appliesTo: () => true,
    declaration: 'I hereby nominate the person(s) named above to receive the amount standing to my credit in the Fund in the event of my death.',
    sections: [
      {
        title: 'A. Member',
        fields: [
          { key: 'name', label: 'Name of member', type: 'text', required: true, prefill: fullName },
          { key: 'address', label: 'Permanent address', type: 'textarea', required: true, full: true, prefill: (c) => c.permanentAddress },
        ],
      },
      {
        title: 'B. Nominee 1',
        fields: [
          { key: 'n1Name', label: 'Name of nominee', type: 'text', required: true, prefill: (c) => c.spouseName ?? c.fatherName },
          { key: 'n1Rel', label: 'Relationship', type: 'select', options: RELATIONS, required: true, sample: 'Spouse' },
          { key: 'n1Dob', label: 'Date of birth', type: 'date', required: true, sample: '1992-03-14' },
          { key: 'n1Share', label: 'Share of nominee (%)', type: 'number', required: true, sample: '100' },
        ],
      },
      {
        title: 'C. Nominee 2 (optional)',
        fields: [
          { key: 'n2Name', label: 'Name of nominee', type: 'text' },
          { key: 'n2Rel', label: 'Relationship', type: 'select', options: RELATIONS },
          { key: 'n2Dob', label: 'Date of birth', type: 'date' },
          { key: 'n2Share', label: 'Share of nominee (%)', type: 'number' },
        ],
      },
    ],
    validate: (v): Record<string, string> => {
      const errs: Record<string, string> = {};
      const s1 = Number(v.n1Share) || 0;
      const s2 = Number(v.n2Share) || 0;
      const hasSecond = Boolean(v.n2Name?.trim());
      if (hasSecond) {
        if (!v.n2Rel) errs.n2Rel = 'Select the relationship of nominee 2.';
        if (!v.n2Dob) errs.n2Dob = 'Enter the date of birth of nominee 2.';
        if (s1 + s2 !== 100) errs.n2Share = `Shares must add up to 100%. They add up to ${s1 + s2}% now.`;
      } else if (v.n1Share && s1 !== 100) {
        errs.n1Share = 'With one nominee the share must be 100%.';
      }
      return errs;
    },
  },
  {
    id: 'esic-declaration',
    code: 'ESIC Form 1',
    name: 'ESIC Declaration Form',
    authority: 'ESIC',
    summary: 'Insured person declaration with family particulars and nominee for ESIC registration.',
    appliesNote: 'Gross wage up to Rs 21,000',
    appliesTo: (c) => c.grossSalaryMonthly <= 21000,
    declaration: 'I declare that the family particulars given above are correct and I will report any change within 30 days.',
    sections: [
      {
        title: 'A. Insured person',
        fields: [
          { key: 'name', label: 'Name of insured person', type: 'text', required: true, prefill: fullName },
          { key: 'dob', label: 'Date of birth', type: 'date', required: true, prefill: (c) => c.dob },
          { key: 'father', label: "Father's name", type: 'text', required: true, prefill: (c) => c.fatherName },
          { key: 'marital', label: 'Marital status', type: 'select', options: ['Single', 'Married', 'Other'], required: true, prefill: (c) => c.maritalStatus },
          { key: 'prevIp', label: 'Previous ESIC (IP) number, if any', type: 'text', pattern: /^\d{10}$/, patternMsg: 'ESIC number has 10 digits.' },
          { key: 'dispensary', label: 'Preferred dispensary / hospital', type: 'text', required: true, sample: 'ESI Dispensary, nearest to residence' },
        ],
      },
      {
        title: 'B. Family details',
        fields: [
          { key: 'spouse', label: 'Name of spouse', type: 'text', prefill: (c) => c.spouseName ?? '' },
          { key: 'children', label: 'Number of dependent children', type: 'number', required: true, sample: '0' },
        ],
      },
      {
        title: 'C. Nominee',
        fields: [
          { key: 'nomName', label: 'Name of nominee', type: 'text', required: true, prefill: (c) => c.spouseName ?? c.fatherName },
          { key: 'nomRel', label: 'Relationship', type: 'select', options: RELATIONS, required: true, sample: 'Father' },
          { key: 'nomAddr', label: 'Address of nominee', type: 'textarea', required: true, full: true, prefill: (c) => c.permanentAddress },
        ],
      },
    ],
  },
  {
    id: 'gratuity-f',
    code: 'Gratuity Form F',
    name: 'Gratuity Nomination (Form F)',
    authority: 'Payment of Gratuity Act, 1972',
    summary: 'Nomination of the person who receives gratuity if the employee passes away in service.',
    appliesNote: 'Every new joiner',
    appliesTo: () => true,
    declaration: 'I nominate the person named above to receive the gratuity payable under the Act. This nomination replaces any earlier nomination.',
    sections: [
      {
        title: 'A. Employee',
        fields: [
          { key: 'name', label: 'Name of employee', type: 'text', required: true, prefill: fullName },
          { key: 'designation', label: 'Designation', type: 'text', required: true, prefill: (c) => c.designation },
          { key: 'doj', label: 'Date of joining', type: 'date', required: true, prefill: (c) => c.dateOfJoining },
        ],
      },
      {
        title: 'B. Nominee',
        fields: [
          { key: 'nomName', label: 'Name of nominee', type: 'text', required: true, prefill: (c) => c.spouseName ?? c.fatherName },
          { key: 'nomRel', label: 'Relationship with employee', type: 'select', options: RELATIONS, required: true, sample: 'Spouse' },
          { key: 'nomAge', label: 'Age of nominee', type: 'number', required: true, sample: '31' },
          { key: 'nomShare', label: 'Share of gratuity (%)', type: 'number', required: true, sample: '100' },
          { key: 'nomAddr', label: 'Address of nominee', type: 'textarea', required: true, full: true, prefill: (c) => c.permanentAddress },
        ],
      },
      {
        title: 'C. Witnesses',
        fields: [
          { key: 'w1', label: 'Witness 1 name', type: 'text', required: true, sample: 'Ramesh Pillai' },
          { key: 'w2', label: 'Witness 2 name', type: 'text', required: true, sample: 'Anita Desai' },
        ],
      },
    ],
    validate: (v): Record<string, string> => {
      const s = Number(v.nomShare);
      return v.nomShare && (s <= 0 || s > 100) ? { nomShare: 'Share must be between 1 and 100.' } : {};
    },
  },
  {
    id: 'pt-declaration',
    code: 'PT Declaration',
    name: 'Professional Tax Declaration',
    authority: 'State Government',
    summary: 'State of deduction, other employment and exemption claim for professional tax.',
    appliesNote: 'Every new joiner',
    appliesTo: () => true,
    declaration: 'I declare that the details above are correct and that I will inform the employer if my work state or exemption status changes.',
    sections: [
      {
        title: 'A. Employee',
        fields: [
          { key: 'name', label: 'Name of employee', type: 'text', required: true, prefill: fullName },
          { key: 'state', label: 'State of work', type: 'select', options: PT_STATES, required: true, prefill: stateOf },
          { key: 'gross', label: 'Monthly gross salary (Rs)', type: 'number', required: true, prefill: (c) => String(c.grossSalaryMonthly) },
        ],
      },
      {
        title: 'B. Other employment and exemption',
        fields: [
          { key: 'other', label: 'Working with another employer now?', type: 'select', options: YES_NO, required: true, sample: 'No' },
          { key: 'otherName', label: 'Name of other employer (if yes)', type: 'text' },
          { key: 'exempt', label: 'Exemption claimed', type: 'select', options: ['None', 'Person with disability', 'Senior citizen (60+)', 'Other'], required: true, sample: 'None' },
          { key: 'ptReg', label: 'PT enrolment number (if any)', type: 'text' },
        ],
      },
    ],
    validate: (v): Record<string, string> => (v.other === 'Yes' && !v.otherName?.trim() ? { otherName: 'Enter the name of the other employer.' } : {}),
  },
];

export const formById = (id: string): FormDef => FORM_DEFS.find((f) => f.id === id) ?? FORM_DEFS[0];

export interface FormSubmission {
  candidateId: string;
  formId: string;
  status: FormStatus;
  values: Record<string, string>;
  declared: boolean;
  signName: string;
  signDate: string;
  updatedAt: string;
  submittedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

export const submissionKey = (candidateId: string, formId: string) => `${candidateId}:${formId}`;

export const prefillValues = (form: FormDef, c: Candidate): Record<string, string> => {
  const out: Record<string, string> = {};
  form.sections.forEach((s) => s.fields.forEach((f) => (out[f.key] = f.prefill?.(c) ?? '')));
  return out;
};

const completeValues = (form: FormDef, c: Candidate): Record<string, string> => {
  const out: Record<string, string> = {};
  form.sections.forEach((s) => s.fields.forEach((f) => (out[f.key] = f.prefill?.(c) || f.sample || (f.type === 'select' ? f.options?.[0] ?? '' : f.type === 'date' ? '1990-01-01' : f.type === 'number' ? '1' : f.required ? 'NA' : ''))));
  return out;
};

export const shiftDate = (iso: string, days: number): string => {
  const d = new Date(Date.parse(iso) + days * 86400000);
  return d.toISOString().slice(0, 10);
};

const PATTERN: FormStatus[] = ['Verified', 'Submitted', 'Not started', 'Draft', 'Verified', 'Returned', 'Submitted', 'Verified'];
const RETURN_REMARKS = [
  'Name does not match the Aadhaar card. Please correct it and submit again.',
  'Nominee date of birth is missing proof. Please recheck and resubmit.',
  'Bank account number does not match the cancelled cheque.',
];

/** Deterministic starting data so the page opens with a realistic spread of statuses. */
export const buildInitialSubmissions = (candidates: Candidate[]): Record<string, FormSubmission> => {
  const out: Record<string, FormSubmission> = {};
  candidates.forEach((c, ci) => {
    FORM_DEFS.forEach((form, fi) => {
      if (!form.appliesTo(c)) return;
      const status = PATTERN[(ci + fi * 3) % PATTERN.length];
      if (status === 'Not started') return;
      const ageDays = 2 + ((ci * 5 + fi * 3) % 14);
      const updatedAt = shiftDate(DASHBOARD_REFERENCE_DATE, -ageDays);
      const base: FormSubmission = { candidateId: c.id, formId: form.id, status, values: {}, declared: false, signName: '', signDate: '', updatedAt };
      if (status === 'Draft') {
        out[submissionKey(c.id, form.id)] = { ...base, values: prefillValues(form, c) };
        return;
      }
      const full: FormSubmission = {
        ...base,
        values: completeValues(form, c),
        declared: true,
        signName: fullName(c),
        signDate: updatedAt,
        submittedAt: updatedAt,
      };
      if (status === 'Verified') {
        full.verifiedBy = 'Priya Nair';
        full.verifiedAt = shiftDate(updatedAt, 1);
      }
      if (status === 'Returned') full.remarks = RETURN_REMARKS[(ci + fi) % RETURN_REMARKS.length];
      out[submissionKey(c.id, form.id)] = full;
    });
  });
  return out;
};

/** Field-level validation (required, pattern, cross-field). Empty object = valid. */
export const validateForm = (form: FormDef, values: Record<string, string>): Record<string, string> => {
  const errs: Record<string, string> = {};
  form.sections.forEach((s) =>
    s.fields.forEach((f) => {
      const v = (values[f.key] ?? '').trim();
      if (f.required && !v) errs[f.key] = `${f.label} is required.`;
      else if (v && f.pattern && !f.pattern.test(v)) errs[f.key] = f.patternMsg ?? `${f.label} is not in the right format.`;
    })
  );
  const cross = form.validate?.(values) ?? {};
  Object.entries(cross).forEach(([k, msg]) => {
    if (!errs[k]) errs[k] = msg;
  });
  return errs;
};
