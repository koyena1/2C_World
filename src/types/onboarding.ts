export type JoiningStatus = 
  | 'Joined' 
  | 'Yet to Join' 
  | 'Offer Accepted' 
  | 'Verification In Progress' 
  | 'Offer Dropped'
  | 'Deferred'
  | 'Dropout';

export type KycDocumentStatus = 
  | 'Verified' 
  | 'Pending Manual Review' 
  | 'API Mismatch' 
  | 'Rejected' 
  | 'Skipped' 
  | 'Not Started';

export type PennyTestStatus = 
  | 'Verified' 
  | 'Pending' 
  | 'Failed' 
  | 'Not Sent';

export interface KycRecord {
  id: string;
  documentType: 'Aadhaar' | 'PAN' | 'Bank' | 'UAN';
  documentNumber: string;
  apiSearchValue: string;
  nameInSystem: string;
  nameInApi: string;
  matchPercentage: number;
  status: KycDocumentStatus;
  lastUpdated: string;
  verifiedBy?: string;
  remarks?: string;
  documentUrl?: string;
  documentFileName?: string;
  documentUploadedAt?: string;
  documentAvailability?: 'Document Uploaded' | 'Missing Document' | 'Rejected Document' | 'Re-upload Requested';
  documentSize?: string;
  uploadedBy?: string;
  previousRejectionReason?: string;
  candidateSubmittedValue?: string;
  auditTrail: {
    id: string;
    action: string;
    timestamp: string;
    actor: string;
    notes: string;
  }[];
}

export interface Candidate {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  emergencyContact: string;
  avatarUrl?: string;
  
  // Job & Company
  clientId: string;
  clientName: string;
  designation: string;
  department: string;
  workLocation: string;
  dateOfInterview: string;
  dateOfJoining: string;
  endOfContract?: string;
  grossSalaryMonthly: number;
  oldEmployeeId?: string;
  clientCandidateCode?: string;
  
  // Sourcing
  source: 'Naukri' | 'LinkedIn' | 'Internal Referral' | 'Campus' | 'Vendor';
  recruiterName: string;
  recruiterEmail: string;
  registrationDate: string;

  // Onboarding Status
  joiningStatus: JoiningStatus;
  candidateStatus?: string;
  pennyTestStatus: PennyTestStatus;
  pennyTestAmount?: number;
  pennyTestAccountHolder?: string;
  onboardingCompletionPct: number;
  overallKycStatus: KycDocumentStatus;
  
  // KYC Records
  kycRecords: KycRecord[];
  
  // Bank Details
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountHolderName: string;
  
  // Personal & Family Details
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  bloodGroup: string;
  maritalStatus: 'Single' | 'Married' | 'Other';
  highestQualification: string;
  fatherName: string;
  motherName: string;
  spouseName?: string;
  currentAddress: string;
  permanentAddress: string;
  
  // Documents
  documents: {
    id: string;
    name: string;
    category: 'Identity' | 'Education' | 'Experience' | 'Statutory';
    uploadedAt: string;
    status: 'Verified' | 'Pending Review' | 'Rejected';
    size: string;
  }[];
  
  // Letters
  letters: {
    id: string;
    title: string;
    issuedDate: string;
    status: 'Accepted' | 'Pending Acceptance' | 'Draft';
    acceptedDate?: string;
  }[];

  // Missing Fields
  missingFields: string[];
}

export interface BulkImportLog {
  id: string;
  fileName: string;
  clientName: string;
  uploadedBy: string;
  uploadedOn: string;
  totalRows: number;
  insertedRows: number;
  failedRows: number;
  status: 'Completed' | 'Partially Completed' | 'Failed' | 'Processing';
  errorReportUrl?: string;
}

export interface FilterOptions {
  searchQuery: string;
  client: string;
  location: string;
  branch?: string;
  department?: string;
  designation: string;
  joiningStatus: string;
  candidateStatus?: string;
  kycStatus: string;
  pennyTestStatus: string;
  bankVerificationStatus?: string;
  oldEmployeeId?: string;
  aadhaarStatus?: string;
  panStatus?: string;
  bankStatus?: string;
  uanStatus?: string;
  dateFrom: string;
  dateTo: string;
  joiningDateFrom?: string;
  joiningDateTo?: string;
  regDateFrom?: string;
  regDateTo?: string;
  contractEndDateFrom?: string;
  contractEndDateTo?: string;
  showOnlyMyCandidates: boolean;
}

