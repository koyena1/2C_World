export type OfferLetterStatus = 
  | 'Not Sent' 
  | 'Sent' 
  | 'Signed' 
  | 'Sent But Not Signed' 
  | 'Pending';

export type LetterGenerationType = 
  | 'Automated' 
  | 'Manual Upload' 
  | 'Bulk Template';

export interface OfferLetterCandidate {
  id: string;
  candidateName: string;
  candidateCode: string;
  email: string;
  phone: string;
  client: string;
  clientId: string;
  location: string;
  designation: string;
  department: string;
  candidateStatus: string; // 'Yet to Join', 'Joined', 'Offer Accepted', 'Verification In Progress', 'Deferred'
  dateOfJoining: string;
  letterGenerationType: LetterGenerationType;
  letterGeneratedDate: string;
  letterSentDate: string | null;
  letterAcceptanceDate: string | null;
  offerLetterStatus: OfferLetterStatus;
  blockingIssue: string; // e.g. 'None', 'Missing Bank Cheque', 'KYC Mismatch', 'Pending Compensation Approval'
  grossSalaryMonthly: number;
  annualCtc: number;
  bankVerificationStatus: 'Verified' | 'Pending' | 'Failed' | 'Not Started';
  aadhaarKycStatus: 'Verified' | 'Pending Manual Review' | 'API Mismatch' | 'Rejected';
  panKycStatus: 'Verified' | 'Pending' | 'Rejected';
  bankKycStatus: 'Verified' | 'Pending' | 'Failed';
  uanKycStatus: 'Verified' | 'Pending' | 'Not Found';
  endOfContract: string | null;
  isMyCandidate: boolean;
  templateName: string;
  sentChannel?: 'Email & WhatsApp' | 'Email' | 'WhatsApp';
  signedAt?: string;
  notes?: string;
}

export interface OfferLetterFilterState {
  // Primary (Always visible)
  client: string;
  location: string;
  designation: string;
  candidateStatus: string;
  letterGenerationType: string;

  // Active status card selection
  statusCardFilter: 'All' | OfferLetterStatus;

  // Date Filters Accordion
  dojFrom: string;
  dojTo: string;
  genFrom: string;
  genTo: string;
  sentFrom: string;
  sentTo: string;
  acceptFrom: string;
  acceptTo: string;

  // Advanced Candidate Filters Accordion
  bankVerification: string;
  contractEndFrom: string;
  contractEndTo: string;
  aadhaarStatus: string;
  panStatus: string;
  bankStatus: string;
  uanStatus: string;
  searchQuery: string;
  showOnlyMyCandidates: boolean;
}
