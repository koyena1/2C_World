export interface TenantSummary {
  id: string;
  code: string;
  name: string;
  tier: 'Platinum' | 'Enterprise Tier-1' | 'Enterprise' | 'Premium';
  activeHeadcount: number;
  activeCandidatesInPipeline: number;
  pendingKycCount: number;
  kycCompliancePct: number;
  activeCycleName: string;
  activeCycleStatus: 'Live Muster' | 'Cutoff Reached' | 'Muster Locked' | 'Payroll Ingested';
  locationsCount: number;
  branchesCount: number;
  primaryLocations: string[];
  accountLead: string;
  lastSyncTime: string;
  statutoryHealth: 'Compliant' | 'Review Needed' | 'Action Overdue';
  gstin: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  subValue: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  timeframe: string;
  category: 'workforce' | 'onboarding' | 'compliance' | 'attendance' | 'import';
}

export interface FunnelStage {
  step: number;
  name: string;
  count: number;
  percentage: number;
  conversionRate: string;
  slaDays: string;
  status: 'on-track' | 'lagging';
}

export interface MicroserviceHealth {
  id: string;
  name: string;
  provider: string;
  category: 'Statutory Verification' | 'Banking & Payouts' | 'Attendance Streams' | 'Document AI';
  status: 'Operational' | 'Degraded' | 'Maintenance';
  latencyMs: number;
  successRate: number;
  requestsToday: number;
  lastChecked: string;
}

export interface SuperAdminAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'KYC' | 'Attendance' | 'Import' | 'Contract';
  tenantId: string;
  tenantName: string;
  dueDate: string;
  actionLabel: string;
  targetView: 'kyc' | 'attendance' | 'import' | 'directory';
}

export interface AuditEventLog {
  id: string;
  timestamp: string;
  tenantName: string;
  tenantCode: string;
  actor: string;
  actorRole: string;
  module: 'Onboarding' | 'KYC Desk' | 'Attendance' | 'Bulk Import' | 'Holidays' | 'System';
  action: string;
  detail: string;
  status: 'Success' | 'Warning' | 'Error';
  ipAddress: string;
}

export const SUPER_ADMIN_TENANTS: TenantSummary[] = [
  {
    id: 'client-2coms',
    code: '2COMS-HQ',
    name: '2COMS Consulting Services',
    tier: 'Platinum',
    activeHeadcount: 3420,
    activeCandidatesInPipeline: 48,
    pendingKycCount: 1,
    kycCompliancePct: 98.4,
    activeCycleName: 'Cycle Oct-2026 (26 Sep - 25 Oct)',
    activeCycleStatus: 'Live Muster',
    locationsCount: 4,
    branchesCount: 8,
    primaryLocations: ['Bangalore', 'Kolkata HQ', 'Hyderabad', 'Mumbai'],
    accountLead: 'Ananya Mukherjee',
    lastSyncTime: '3 mins ago',
    statutoryHealth: 'Compliant',
    gstin: '19AAAC2200R1Z5',
  },
  {
    id: 'client-flipkart',
    code: 'FLIP-IND',
    name: 'Flipkart India Pvt Ltd',
    tier: 'Enterprise Tier-1',
    activeHeadcount: 4850,
    activeCandidatesInPipeline: 34,
    pendingKycCount: 1,
    kycCompliancePct: 97.2,
    activeCycleName: 'October Regular (01 Oct - 31 Oct)',
    activeCycleStatus: 'Live Muster',
    locationsCount: 5,
    branchesCount: 14,
    primaryLocations: ['Bangalore Campus', 'Bhiwandi Fulfillment Hub', 'Gurgaon Hub', 'Hyderabad'],
    accountLead: 'Rohan Deshmukh',
    lastSyncTime: '1 min ago',
    statutoryHealth: 'Compliant',
    gstin: '29AABCF3920K1ZX',
  },
  {
    id: 'client-tcs',
    code: 'TCS-CORP',
    name: 'Tata Consultancy Services',
    tier: 'Enterprise Tier-1',
    activeHeadcount: 2780,
    activeCandidatesInPipeline: 26,
    pendingKycCount: 1,
    kycCompliancePct: 96.8,
    activeCycleName: 'Cycle Oct-2026 (26 Sep - 25 Oct)',
    activeCycleStatus: 'Live Muster',
    locationsCount: 3,
    branchesCount: 7,
    primaryLocations: ['Bangalore Whitefield', 'Pune Hinjewadi', 'Chennai Siruseri'],
    accountLead: 'Pooja Iyer',
    lastSyncTime: '6 mins ago',
    statutoryHealth: 'Compliant',
    gstin: '27AAACT2727Q1ZW',
  },
  {
    id: 'client-infosys',
    code: 'INFY-BPM',
    name: 'Infosys BPM Limited',
    tier: 'Enterprise',
    activeHeadcount: 1940,
    activeCandidatesInPipeline: 18,
    pendingKycCount: 0,
    kycCompliancePct: 99.2,
    activeCycleName: 'October Standard Cycle',
    activeCycleStatus: 'Live Muster',
    locationsCount: 3,
    branchesCount: 5,
    primaryLocations: ['Bangalore Electronics City', 'Pune Phase-2', 'Hyderabad Gachibowli'],
    accountLead: 'Vikram Joshi',
    lastSyncTime: '12 mins ago',
    statutoryHealth: 'Compliant',
    gstin: '29AAACI4811L1ZO',
  },
  {
    id: 'client-tata1mg',
    code: 'TATA-1MG',
    name: 'Tata 1mg Healthcare',
    tier: 'Premium',
    activeHeadcount: 820,
    activeCandidatesInPipeline: 8,
    pendingKycCount: 0,
    kycCompliancePct: 98.8,
    activeCycleName: 'Cycle Oct-2026 (01 Oct - 31 Oct)',
    activeCycleStatus: 'Live Muster',
    locationsCount: 3,
    branchesCount: 4,
    primaryLocations: ['Gurgaon Sector 32 HQ', 'Noida Facility', 'Bangalore Koramangala'],
    accountLead: 'Sneha Roy',
    lastSyncTime: '18 mins ago',
    statutoryHealth: 'Compliant',
    gstin: '06AABCT4829N1ZM',
  },
  {
    id: 'client-reliance',
    code: 'REL-RETL',
    name: 'Reliance Retail Ventures',
    tier: 'Enterprise',
    activeHeadcount: 650,
    activeCandidatesInPipeline: 5,
    pendingKycCount: 1,
    kycCompliancePct: 95.4,
    activeCycleName: 'Cycle Oct-2026',
    activeCycleStatus: 'Live Muster',
    locationsCount: 3,
    branchesCount: 6,
    primaryLocations: ['Mumbai BKC', 'Navi Mumbai Ghansoli', 'Ahmedabad'],
    accountLead: 'Karan Mehra',
    lastSyncTime: '22 mins ago',
    statutoryHealth: 'Review Needed',
    gstin: '27AABCR5512P1ZN',
  },
  {
    id: 'client-hdfc',
    code: 'HDFC-CORP',
    name: 'HDFC Bank Limited',
    tier: 'Enterprise',
    activeHeadcount: 382,
    activeCandidatesInPipeline: 3,
    pendingKycCount: 0,
    kycCompliancePct: 99.6,
    activeCycleName: 'Cycle Oct-2026 BFSI',
    activeCycleStatus: 'Live Muster',
    locationsCount: 2,
    branchesCount: 3,
    primaryLocations: ['Mumbai Senapati Bapat Marg', 'Chennai Mount Road'],
    accountLead: 'Devendra Parikh',
    lastSyncTime: '30 mins ago',
    statutoryHealth: 'Compliant',
    gstin: '27AAACH2702H1ZQ',
  },
];

export const KPI_SUMMARIES: KpiMetric[] = [
  {
    id: 'total-workforce',
    label: 'Total Active Workforce',
    value: '14,842',
    subValue: 'Across 7 enterprise tenants',
    change: '+4.2% MoM',
    trend: 'up',
    timeframe: 'Current Billing Month',
    category: 'workforce',
  },
  {
    id: 'pipeline-candidates',
    label: 'Candidates in Onboarding',
    value: '142',
    subValue: '38 offer letters joined this month',
    change: '+18% vs last month',
    trend: 'up',
    timeframe: 'Active pipeline',
    category: 'onboarding',
  },
  {
    id: 'kyc-compliance',
    label: 'Statutory KYC Pass Rate',
    value: '97.4%',
    subValue: '1,280 verified via ₹1 & NSDL',
    change: '+1.6% SLA gain',
    trend: 'up',
    timeframe: 'FY26 Q3 to date',
    category: 'compliance',
  },
  {
    id: 'attendance-muster',
    label: 'Attendance Muster Capture',
    value: '98.7%',
    subValue: '7/7 live attendance cycles',
    change: '0.2% variance',
    trend: 'neutral',
    timeframe: 'October 2026 Cycle',
    category: 'attendance',
  },
  {
    id: 'import-throughput',
    label: 'Bulk Ingestion Volume',
    value: '24,190',
    subValue: 'Rows processed in 15 batches',
    change: '99.4% first-pass pass rate',
    trend: 'up',
    timeframe: 'Last 7 days',
    category: 'import',
  },
];

export const FUNNEL_STAGES: FunnelStage[] = [
  {
    step: 1,
    name: 'Sourced & Invited',
    count: 142,
    percentage: 100,
    conversionRate: '100%',
    slaDays: 'Day 0',
    status: 'on-track',
  },
  {
    step: 2,
    name: 'Registration & Profile Filled',
    count: 124,
    percentage: 87.3,
    conversionRate: '87.3%',
    slaDays: 'Avg 1.2 days',
    status: 'on-track',
  },
  {
    step: 3,
    name: 'Identity & KYC Submitted',
    count: 118,
    percentage: 83.1,
    conversionRate: '95.1%',
    slaDays: 'Avg 0.8 days',
    status: 'on-track',
  },
  {
    step: 4,
    name: '₹1 Penny Drop Verified',
    count: 112,
    percentage: 78.8,
    conversionRate: '94.9%',
    slaDays: 'Instant (< 5 min)',
    status: 'on-track',
  },
  {
    step: 5,
    name: 'Background Verification Passed',
    count: 98,
    percentage: 69.0,
    conversionRate: '87.5%',
    slaDays: 'Avg 2.4 days',
    status: 'on-track',
  },
  {
    step: 6,
    name: 'Offer Letter Countersigned',
    count: 82,
    percentage: 57.7,
    conversionRate: '83.6%',
    slaDays: 'Avg 1.1 days',
    status: 'on-track',
  },
  {
    step: 7,
    name: 'Joined & Deployed to Muster',
    count: 64,
    percentage: 45.1,
    conversionRate: '78.0%',
    slaDays: 'Target Date Match',
    status: 'on-track',
  },
];

export const MICROSERVICES_HEALTH: MicroserviceHealth[] = [
  {
    id: 'srv-nsdl',
    name: 'NSDL PAN Tax Identity API',
    provider: 'Protean / NSDL e-Gov',
    category: 'Statutory Verification',
    status: 'Operational',
    latencyMs: 142,
    successRate: 99.8,
    requestsToday: 384,
    lastChecked: '45s ago',
  },
  {
    id: 'srv-karza',
    name: 'Karza Bank Account ₹1 Penny Drop',
    provider: 'NPCI IMPS Fast Rail',
    category: 'Banking & Payouts',
    status: 'Operational',
    latencyMs: 310,
    successRate: 98.9,
    requestsToday: 219,
    lastChecked: '1m ago',
  },
  {
    id: 'srv-aadhaar',
    name: 'DigiLocker & UIDAI eKYC Gateway',
    provider: 'National Informatics Centre',
    category: 'Statutory Verification',
    status: 'Operational',
    latencyMs: 220,
    successRate: 99.4,
    requestsToday: 412,
    lastChecked: '30s ago',
  },
  {
    id: 'srv-biometric',
    name: 'Biometric Attendance Punch Pipe',
    provider: '2COMS Edge Ingestion',
    category: 'Attendance Streams',
    status: 'Operational',
    latencyMs: 64,
    successRate: 99.9,
    requestsToday: 18450,
    lastChecked: 'Live Stream',
  },
  {
    id: 'srv-epfo',
    name: 'EPFO UAN Service History Ingestion',
    provider: 'EPFO Unified Portal API',
    category: 'Statutory Verification',
    status: 'Operational',
    latencyMs: 480,
    successRate: 97.2,
    requestsToday: 140,
    lastChecked: '3m ago',
  },
  {
    id: 'srv-ocr',
    name: 'Document OCR & Cheque AI Extraction',
    provider: 'Tesseract & Vision AI',
    category: 'Document AI',
    status: 'Operational',
    latencyMs: 512,
    successRate: 98.4,
    requestsToday: 295,
    lastChecked: '2m ago',
  },
];

export const CRITICAL_ALERTS: SuperAdminAlert[] = [
  {
    id: 'alert-01',
    title: 'Manual Bank Name Mismatch for Rajesh Gupta',
    description: 'IMPS Penny Drop verified ₹1.00 but bank registered name is "RAJESH KUMAR GUPTA" vs candidate "Rajesh Gupta".',
    severity: 'critical',
    category: 'KYC',
    tenantId: 'client-flipkart',
    tenantName: 'Flipkart India Pvt Ltd',
    dueDate: 'Action Required Today',
    actionLabel: 'Review in KYC Desk',
    targetView: 'kyc',
  },
  {
    id: 'alert-02',
    title: 'Attendance Cycle Cutoff for 2COMS Consulting',
    description: 'Attendance cycle Oct-2026 reaches cutoff in 48 hours. 18 biometric punch exceptions pending manager resolution.',
    severity: 'warning',
    category: 'Attendance',
    tenantId: 'client-2coms',
    tenantName: '2COMS Consulting Services',
    dueDate: 'Within 48h',
    actionLabel: 'Open Attendance Muster',
    targetView: 'attendance',
  },
  {
    id: 'alert-03',
    title: 'Bulk Shift Roster Validation Warnings',
    description: 'Batch #IMP-2026-8803 uploaded with 14 shift code warnings for Mumbai Kurla warehouse employees.',
    severity: 'warning',
    category: 'Import',
    tenantId: 'client-reliance',
    tenantName: 'Reliance Retail Ventures',
    dueDate: 'Next Shift Cycle',
    actionLabel: 'Open Bulk Import Hub',
    targetView: 'import',
  },
  {
    id: 'alert-04',
    title: 'Unsigned Employment Annexure for 2 TCS Candidates',
    description: 'Candidate offer letters generated 5 days ago have pending digital signature confirmation before joining date.',
    severity: 'info',
    category: 'Contract',
    tenantId: 'client-tcs',
    tenantName: 'Tata Consultancy Services',
    dueDate: 'Before 01 Oct',
    actionLabel: 'Inspect Directory',
    targetView: 'directory',
  },
];

export const RECENT_AUDIT_LOGS: AuditEventLog[] = [
  {
    id: 'log-101',
    timestamp: '2 mins ago',
    tenantName: 'Flipkart India Pvt Ltd',
    tenantCode: 'FLIP-IND',
    actor: 'Rohan Deshmukh',
    actorRole: 'Ops Lead',
    module: 'Bulk Import',
    action: 'Uploaded Shift Roster Batch #IMP-2026-8804',
    detail: '1,450 roster entries parsed successfully for Bangalore Fulfilment Center.',
    status: 'Success',
    ipAddress: '10.14.88.22',
  },
  {
    id: 'log-102',
    timestamp: '8 mins ago',
    tenantName: 'Tata Consultancy Services',
    tenantCode: 'TCS-CORP',
    actor: 'Priya Sharma (Self-Service)',
    actorRole: 'Candidate',
    module: 'KYC Desk',
    action: 'Completed ₹1 Penny Drop Verification',
    detail: 'HDFC Bank Account ending in *8492 successfully credited ₹1.00 with IMPS RRN #482910384.',
    status: 'Success',
    ipAddress: '49.207.182.11',
  },
  {
    id: 'log-103',
    timestamp: '14 mins ago',
    tenantName: '2COMS Consulting Services',
    tenantCode: '2COMS-HQ',
    actor: 'Ananya Mukherjee',
    actorRole: 'Super Admin',
    module: 'Attendance',
    action: 'Synchronized Attendance Cycle Oct-2026',
    detail: 'Triggered biometric sync across 8 branches; 3,420 muster records refreshed.',
    status: 'Success',
    ipAddress: '10.12.0.4',
  },
  {
    id: 'log-104',
    timestamp: '25 mins ago',
    tenantName: 'Reliance Retail Ventures',
    tenantCode: 'REL-RETL',
    actor: 'Karan Mehra',
    actorRole: 'Client HR',
    module: 'Bulk Import',
    action: 'Exported Candidate Import Template',
    detail: 'Downloaded 28-column master candidate template for Q3 seasonal onboarding.',
    status: 'Success',
    ipAddress: '115.112.44.18',
  },
  {
    id: 'log-105',
    timestamp: '42 mins ago',
    tenantName: 'Infosys BPM Limited',
    tenantCode: 'INFY-BPM',
    actor: 'Vikram Joshi',
    actorRole: 'Ops Manager',
    module: 'Holidays',
    action: 'Published Karnataka Holiday Calendar 2026',
    detail: '14 statutory state holidays configured and mapped to Bangalore Electronics City campus.',
    status: 'Success',
    ipAddress: '10.18.9.112',
  },
  {
    id: 'log-106',
    timestamp: '1 hour ago',
    tenantName: 'Tata 1mg Healthcare',
    tenantCode: 'TATA-1MG',
    actor: 'Automated UIDAI Gateway',
    actorRole: 'System Daemon',
    module: 'KYC Desk',
    action: 'Auto-verified Aadhaar eKYC via OTP',
    detail: 'Aadhaar demographic matching score 100% for candidate Snehashis Pal (1MG-GUR-1042).',
    status: 'Success',
    ipAddress: '172.16.0.8',
  },
];
