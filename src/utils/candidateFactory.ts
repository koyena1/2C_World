import type { Candidate, KycRecord } from '../types/onboarding';

type KycDocType = KycRecord['documentType'];

/** Government registry each KYC document is checked against (labels only; no live integration). */
const KYC_SOURCES: Array<{ type: KycDocType; idPrefix: string; source: string }> = [
  { type: 'Aadhaar', idPrefix: 'k-a', source: 'UIDAI' },
  { type: 'PAN', idPrefix: 'k-p', source: 'NSDL' },
  { type: 'Bank', idPrefix: 'k-b', source: 'NPCI' },
  { type: 'UAN', idPrefix: 'k-u', source: 'EPFO' },
];

/**
 * Builds a complete Candidate record from the partial data captured by the
 * "Add Candidate" invitation flow, filling the rest with onboarding defaults.
 */
export const createCandidateFromInvite = (newCand: Partial<Candidate>): Candidate => {
  const fullName = `${newCand.firstName} ${newCand.lastName}`;

  const kycRecords: KycRecord[] = KYC_SOURCES.map(({ type, idPrefix, source }) => ({
    id: `${idPrefix}-${Date.now()}`,
    documentType: type,
    documentNumber: 'Pending Upload',
    apiSearchValue: source,
    nameInSystem: fullName,
    nameInApi: '',
    matchPercentage: 0,
    status: 'Not Started',
    lastUpdated: 'Just now',
    auditTrail: [],
  }));

  return {
    id: newCand.id || `cand-${Date.now()}`,
    userId: newCand.userId || '2C-2026-9999',
    firstName: newCand.firstName || 'Candidate',
    lastName: newCand.lastName || 'Name',
    email: newCand.email || 'candidate@example.com',
    phone: newCand.phone || '+91 98000 00000',
    whatsappNumber: newCand.whatsappNumber || '+91 98000 00000',
    emergencyContact: newCand.emergencyContact || 'Pending',
    gender: 'Male',
    dob: '1995-01-01',
    bloodGroup: 'O+',
    highestQualification: 'B.Tech',
    fatherName: 'Father Name',
    motherName: 'Mother Name',
    maritalStatus: 'Single',
    currentAddress: 'Bangalore, Karnataka',
    permanentAddress: 'Bangalore, Karnataka',
    clientId: 'CL-TCS-01',
    clientName: newCand.clientName || 'Tata Consultancy Services',
    designation: newCand.designation || 'Software Engineer',
    department: 'Engineering Deputation',
    branchName: 'Bangalore SEZ',
    workLocation: newCand.workLocation || 'Bangalore',
    recruiterName: newCand.recruiterName || 'Ananya Mukherjee',
    recruiterEmail: 'ananya.m@2coms.com',
    source: newCand.source || 'Naukri',
    registrationDate: '2026-09-23',
    dateOfJoining: newCand.dateOfJoining || '2026-10-15',
    dateOfInterview: '2026-09-22',
    joiningStatus: 'Yet to Join',
    overallKycStatus: 'Not Started',
    pennyTestStatus: 'Not Sent',
    onboardingCompletionPct: 15,
    grossSalaryMonthly: 65000,
    bankName: 'Pending',
    accountNumber: 'Pending',
    ifscCode: 'Pending',
    accountHolderName: `${newCand.firstName || 'Candidate'} ${newCand.lastName || 'Name'}`,
    kycRecords,
    documents: [],
    letters: [],
    missingFields: [],
  };
};
