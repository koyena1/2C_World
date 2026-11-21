export interface TemplateColumn {
  name: string;
  key: string;
  type: 'Text' | 'Number' | 'Date' | 'Enum' | 'Boolean' | 'Email' | 'Phone';
  required: boolean;
  sample: string;
  description: string;
  validationRule: string;
}

export interface ImportValidationError {
  row: number;
  identifier: string;
  field: string;
  value: string;
  reason: string;
  severity: 'Critical' | 'Warning';
  suggestedFix: string;
}

export interface ImportContextField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: string[];
  defaultValue: string;
  required: boolean;
  helperText?: string;
}

export interface ImportTypeDefinition {
  id: string;
  name: string;
  shortName: string;
  category: 'Candidate Lifecycle' | 'Master Data' | 'Attendance & Workforce' | 'Payroll & Compensation' | 'Client Setup';
  description: string;
  badge: string;
  iconName: string;
  templateFileName: string;
  templateHeaders: string[];
  sampleRows: Record<string, string>[];
  columns: TemplateColumn[];
  contextFields: ImportContextField[];
  guidelines: string[];
  mockErrors: ImportValidationError[];
  defaultSuccessCount: number;
  defaultErrorCount: number;
  defaultWarningCount: number;
  supportedFileFormats: string[];
}

export interface ExtendedImportLog {
  id: string;
  importTypeId: string;
  importTypeName: string;
  category: string;
  fileName: string;
  clientOrEntity: string;
  uploadedBy: string;
  uploadedOn: string;
  totalRows: number;
  insertedRows: number;
  failedRows: number;
  warningsCount?: number;
  status: 'Completed' | 'Partially Completed' | 'Failed' | 'Processing';
  errorReportUrl?: string;
}

export const IMPORT_CATEGORIES = [
  {
    id: 'candidate-lifecycle',
    name: 'Candidate Lifecycle',
    description: 'Onboarding, rejoining profiles, client pipeline allocations, and hierarchical reporting chains.',
    iconName: 'UserCheck',
    colorTheme: 'sky',
    types: ['candidate-registration', 'candidate-rejoin', 'candidate-hierarchy']
  },
  {
    id: 'master-data',
    name: 'Master Data',
    description: 'Organizational foundations, business verticals, grades, departments, and job role classifications.',
    iconName: 'Database',
    colorTheme: 'indigo',
    types: ['business-vertical', 'category-master', 'department-master', 'job-role-master']
  },
  {
    id: 'attendance-workforce',
    name: 'Attendance & Workforce',
    description: 'Shift rosters, biometric punch feeds, opening leave balances, and statutory holiday calendars.',
    iconName: 'CalendarClock',
    colorTheme: 'emerald',
    types: ['shift-roster', 'leave-opening-balance', 'raw-attendance-punch', 'holiday-calendar-import']
  },
  {
    id: 'payroll-compensation',
    name: 'Payroll & Compensation',
    description: 'Bulk payslip itemization, CTC annexure structures, earnings/deduction matrix, and payouts.',
    iconName: 'Coins',
    colorTheme: 'amber',
    types: ['payslip-bulk', 'salary-annexure']
  },
  {
    id: 'client-setup',
    name: 'Client Setup',
    description: 'Multi-location client enterprise topologies, operational branches, and geo-fence parameters.',
    iconName: 'Building2',
    colorTheme: 'purple',
    types: ['client-location-import', 'branch-mapping-import']
  }
];

export const ALL_IMPORT_TYPES: ImportTypeDefinition[] = [
  // --------------------------------------------------------------------------
  // 1. Candidate Lifecycle
  // --------------------------------------------------------------------------
  {
    id: 'candidate-registration',
    name: 'Candidate Registration / Onboarding',
    shortName: 'Candidate Registration',
    category: 'Candidate Lifecycle',
    description: 'Bulk upload newly sourced candidates to kickstart automated digital onboarding, KYC collection, and document verification.',
    badge: 'Onboarding Pipeline',
    iconName: 'UserPlus',
    templateFileName: 'Template_Candidate_Registration_v2.xlsx',
    supportedFileFormats: ['.xlsx', '.xls', '.csv'],
    templateHeaders: [
      'Candidate_First_Name', 'Candidate_Last_Name', 'Personal_Email', 'Mobile_Number',
      'Client_Name', 'Designation', 'Department', 'Work_Location', 'Gross_Salary_Monthly',
      'Date_of_Joining', 'Sourcing_Channel', 'Recruiter_Name', 'PAN_Number', 'Aadhaar_Number',
      'Bank_Account_Number', 'Bank_IFSC_Code'
    ],
    sampleRows: [
      {
        'Candidate_First_Name': 'Rahul',
        'Candidate_Last_Name': 'Verma',
        'Personal_Email': 'rahul.verma@example.com',
        'Mobile_Number': '9876543210',
        'Client_Name': 'Tata Consultancy Services',
        'Designation': 'Software Engineer',
        'Department': 'Digital Operations',
        'Work_Location': 'Bangalore - Whitefield',
        'Gross_Salary_Monthly': '65000',
        'Date_of_Joining': '2026-10-15',
        'Sourcing_Channel': 'Naukri',
        'Recruiter_Name': 'Ananya Mukherjee',
        'PAN_Number': 'ABCDE1234F',
        'Aadhaar_Number': '987654321098',
        'Bank_Account_Number': '0029104000192841',
        'Bank_IFSC_Code': 'HDFC0000029'
      },
      {
        'Candidate_First_Name': 'Sneha',
        'Candidate_Last_Name': 'Patel',
        'Personal_Email': 'sneha.patel@example.com',
        'Mobile_Number': '9812345678',
        'Client_Name': 'Flipkart Internet Pvt Ltd',
        'Designation': 'Operations Lead',
        'Department': 'Logistics Hub',
        'Work_Location': 'Hyderabad - HITEC City',
        'Gross_Salary_Monthly': '58000',
        'Date_of_Joining': '2026-10-20',
        'Sourcing_Channel': 'LinkedIn',
        'Recruiter_Name': 'Kunal Sen',
        'PAN_Number': 'BKZPP4567M',
        'Aadhaar_Number': '453218907654',
        'Bank_Account_Number': '918020034567891',
        'Bank_IFSC_Code': 'UTIB0000123'
      }
    ],
    columns: [
      { name: 'Candidate First Name', key: 'Candidate_First_Name', type: 'Text', required: true, sample: 'Rahul', description: 'Legal first name as printed on Govt ID', validationRule: 'Letters only, min 2 chars' },
      { name: 'Candidate Last Name', key: 'Candidate_Last_Name', type: 'Text', required: true, sample: 'Verma', description: 'Legal surname', validationRule: 'Letters only' },
      { name: 'Personal Email', key: 'Personal_Email', type: 'Email', required: true, sample: 'rahul.verma@example.com', description: 'Primary contact email for onboarding invite', validationRule: 'Valid email syntax, unique in database' },
      { name: 'Mobile Number', key: 'Mobile_Number', type: 'Phone', required: true, sample: '9876543210', description: '10-digit Indian mobile number', validationRule: '10 digits starting with 6, 7, 8, 9' },
      { name: 'Client Name', key: 'Client_Name', type: 'Enum', required: true, sample: 'Tata Consultancy Services', description: 'Assigned client deployment account', validationRule: 'Must match active Client Master' },
      { name: 'Designation', key: 'Designation', type: 'Text', required: true, sample: 'Software Engineer', description: 'Job role title', validationRule: 'Min 3 chars' },
      { name: 'Department', key: 'Department', type: 'Text', required: true, sample: 'Digital Operations', description: 'Organizational unit', validationRule: 'Valid Dept name' },
      { name: 'Work Location', key: 'Work_Location', type: 'Text', required: true, sample: 'Bangalore - Whitefield', description: 'Physical reporting office', validationRule: 'Must match registered client location' },
      { name: 'Gross Salary Monthly', key: 'Gross_Salary_Monthly', type: 'Number', required: true, sample: '65000', description: 'Monthly fixed gross compensation in INR', validationRule: 'Numeric value >= 12000' },
      { name: 'Date of Joining', key: 'Date_of_Joining', type: 'Date', required: true, sample: '2026-10-15', description: 'Projected onboarding day', validationRule: 'Format: YYYY-MM-DD' },
      { name: 'PAN Number', key: 'PAN_Number', type: 'Text', required: false, sample: 'ABCDE1234F', description: '10-digit Income Tax PAN card', validationRule: '5 letters + 4 digits + 1 letter' },
      { name: 'Aadhaar Number', key: 'Aadhaar_Number', type: 'Text', required: false, sample: '987654321098', description: '12-digit UIDAI number', validationRule: '12 digits numeric only' },
      { name: 'Bank IFSC Code', key: 'Bank_IFSC_Code', type: 'Text', required: false, sample: 'HDFC0000029', description: '11-character RBI branch code', validationRule: '4 alpha + 0 + 6 alphanumeric' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Target Client Account',
        type: 'select',
        options: ['Tata Consultancy Services', '2COMS Services', 'Flipkart Internet Pvt Ltd', 'HDFC Bank Ltd', 'Infosys BPM', 'Tech Mahindra'],
        defaultValue: 'Tata Consultancy Services',
        required: true,
        helperText: 'Select the client for which these candidates are being onboarded'
      },
      {
        key: 'sourcingChannel',
        label: 'Primary Sourcing Channel',
        type: 'select',
        options: ['Naukri', 'LinkedIn', 'Internal Referral', 'Campus Placement', 'Staffing Partner', 'Direct Walk-in'],
        defaultValue: 'Naukri',
        required: true
      },
      {
        key: 'batchName',
        label: 'Batch Tag / Cohort Name',
        type: 'text',
        defaultValue: 'Q4_Campus_Batch_2026',
        required: false,
        helperText: 'Optional label to group candidates in directory filters'
      }
    ],
    guidelines: [
      'Do not rename or delete any template header columns.',
      'Dates must follow the ISO-8601 standard format: YYYY-MM-DD (e.g., 2026-10-15).',
      'PAN numbers are strictly validated against the Income Tax format (5 uppercase letters, 4 numbers, 1 uppercase letter).',
      'Mobile numbers should be 10 digits without leading 0 or +91 country prefixes.',
      'Candidates uploaded will automatically receive a welcome link with digital onboarding steps.'
    ],
    mockErrors: [
      { row: 14, identifier: 'Vikram Malhotra', field: 'PAN_Number', value: 'AB1234567', reason: 'Invalid PAN syntax: must be 10 alphanumeric characters (5 letters, 4 digits, 1 letter).', severity: 'Critical', suggestedFix: 'Provide valid 10-char PAN or leave blank if pending' },
      { row: 28, identifier: 'Anita Roy', field: 'Mobile_Number', value: '9820154321', reason: 'Duplicate mobile number: already exists for active candidate in Flipkart pipeline.', severity: 'Critical', suggestedFix: 'Verify candidate identity or use alternate phone' },
      { row: 39, identifier: 'Suresh Raina', field: 'Date_of_Joining', value: '2026-08-01', reason: 'Date of Joining (2026-08-01) cannot be earlier than batch registration date (2026-09-20).', severity: 'Critical', suggestedFix: 'Correct target joining date to a future or current date' },
      { row: 52, identifier: 'Pooja Hegde', field: 'Bank_IFSC_Code', value: 'HDFC000', reason: 'Invalid IFSC code length: must be exactly 11 characters starting with 4-letter bank code.', severity: 'Critical', suggestedFix: 'Use valid 11-character RBI IFSC (e.g., HDFC0000029)' },
      { row: 61, identifier: 'Tanmay Bhatt', field: 'Gross_Salary_Monthly', value: '11500', reason: 'Monthly gross salary is below client statutory minimum threshold of ₹12,000.', severity: 'Warning', suggestedFix: 'Confirm if apprentice stipend or adjust to minimum wage' }
    ],
    defaultSuccessCount: 59,
    defaultErrorCount: 4,
    defaultWarningCount: 1
  },

  {
    id: 'candidate-rejoin',
    name: 'Candidate Rejoin Import',
    shortName: 'Candidate Rejoin',
    category: 'Candidate Lifecycle',
    description: 'Bulk process returning ex-employees or rehired contractual resources, mapping their previous employee code and preserving prior service tenure.',
    badge: 'Rehire Management',
    iconName: 'RotateCcw',
    templateFileName: 'Template_Candidate_Rejoin_v1.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Previous_Employee_Code', 'Full_Name', 'Personal_Email', 'Mobile_Number',
      'Client_Name', 'Previous_Exit_Date', 'Rejoin_Date', 'New_Designation',
      'New_Department', 'New_Gross_Monthly', 'Exit_Clearance_Verified', 'Tenure_Continuity_Flag'
    ],
    sampleRows: [
      {
        'Previous_Employee_Code': '2CS-7812',
        'Full_Name': 'Karthik Ramanathan',
        'Personal_Email': 'karthik.r@example.com',
        'Mobile_Number': '9840123456',
        'Client_Name': 'Tata Consultancy Services',
        'Previous_Exit_Date': '2025-11-30',
        'Rejoin_Date': '2026-10-01',
        'New_Designation': 'Senior System Analyst',
        'New_Department': 'Cloud Infrastructure',
        'New_Gross_Monthly': '82000',
        'Exit_Clearance_Verified': 'YES',
        'Tenure_Continuity_Flag': 'NO'
      },
      {
        'Previous_Employee_Code': '2CS-6490',
        'Full_Name': 'Sunita Ghosh',
        'Personal_Email': 'sunita.g@example.com',
        'Mobile_Number': '9830198765',
        'Client_Name': '2COMS Services',
        'Previous_Exit_Date': '2026-02-15',
        'Rejoin_Date': '2026-10-15',
        'New_Designation': 'Operations Lead',
        'New_Department': 'Talent Acquisition',
        'New_Gross_Monthly': '68000',
        'Exit_Clearance_Verified': 'YES',
        'Tenure_Continuity_Flag': 'YES'
      }
    ],
    columns: [
      { name: 'Previous Employee Code', key: 'Previous_Employee_Code', type: 'Text', required: true, sample: '2CS-7812', description: 'Original employee code from previous tenure', validationRule: 'Must match an exited employee record' },
      { name: 'Full Name', key: 'Full_Name', type: 'Text', required: true, sample: 'Karthik Ramanathan', description: 'Employee name', validationRule: 'Min 3 chars' },
      { name: 'Previous Exit Date', key: 'Previous_Exit_Date', type: 'Date', required: true, sample: '2025-11-30', description: 'Date of formal relief', validationRule: 'YYYY-MM-DD' },
      { name: 'Rejoin Date', key: 'Rejoin_Date', type: 'Date', required: true, sample: '2026-10-01', description: 'New joining date', validationRule: 'Must be after Exit Date' },
      { name: 'Exit Clearance Verified', key: 'Exit_Clearance_Verified', type: 'Enum', required: true, sample: 'YES', description: 'No-dues confirmation from previous tenure', validationRule: 'YES or NO' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Client Account',
        type: 'select',
        options: ['Tata Consultancy Services', '2COMS Services', 'Cognizant Technology', 'Wipro Enterprise'],
        defaultValue: '2COMS Services',
        required: true
      },
      {
        key: 'kycMode',
        label: 'KYC Verification Mode',
        type: 'select',
        options: ['Delta KYC (Only changed docs)', 'Full Fresh KYC Re-Verification', 'Bypass if within 6 months'],
        defaultValue: 'Delta KYC (Only changed docs)',
        required: true
      }
    ],
    guidelines: [
      'The previous employee code must exist in the archive master.',
      'Rejoining candidate KYC will automatically link with existing UAN and PAN profiles.',
      'Ensure Exit Clearance is verified with HR Ops prior to batch confirmation.'
    ],
    mockErrors: [
      { row: 7, identifier: 'Amitav Ghosh', field: 'Previous_Employee_Code', value: '2CS-9999', reason: 'Employee code 2CS-9999 was not found in the historical exit database.', severity: 'Critical', suggestedFix: 'Verify original employee code in HR archives' },
      { row: 18, identifier: 'Priya Kulkarni', field: 'Exit_Clearance_Verified', value: 'NO', reason: 'Candidate has outstanding assets or pending no-dues from prior exit in 2025.', severity: 'Critical', suggestedFix: 'Clear pending dues before re-initiating rehire' }
    ],
    defaultSuccessCount: 32,
    defaultErrorCount: 2,
    defaultWarningCount: 0
  },

  {
    id: 'candidate-hierarchy',
    name: 'Candidate Hierarchy Import',
    shortName: 'Candidate Hierarchy',
    category: 'Candidate Lifecycle',
    description: 'Bulk map reporting relationships, supervisor hierarchy trees (L1/L2 managers), and department approval flows.',
    badge: 'Reporting Tree',
    iconName: 'GitFork',
    templateFileName: 'Template_Candidate_Hierarchy_v1.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Employee_Code', 'Employee_Name', 'L1_Manager_Code', 'L1_Manager_Name',
      'L2_Manager_Code', 'L2_Manager_Name', 'Department', 'Designation', 'Effective_Date'
    ],
    sampleRows: [
      {
        'Employee_Code': 'DRFL032',
        'Employee_Name': 'Noushad Mansurii',
        'L1_Manager_Code': 'DRFL029',
        'L1_Manager_Name': 'Anik Bandopadhyay',
        'L2_Manager_Code': 'DRFL030',
        'L2_Manager_Name': 'Bobby Daze',
        'Department': 'Technology',
        'Designation': 'Senior Executive',
        'Effective_Date': '2026-10-01'
      }
    ],
    columns: [
      { name: 'Employee Code', key: 'Employee_Code', type: 'Text', required: true, sample: 'DRFL032', description: 'Assigned employee code', validationRule: 'Must be active employee' },
      { name: 'L1 Manager Code', key: 'L1_Manager_Code', type: 'Text', required: true, sample: 'DRFL029', description: 'Direct supervisor employee code', validationRule: 'Must be active manager, cannot be self' },
      { name: 'Effective Date', key: 'Effective_Date', type: 'Date', required: true, sample: '2026-10-01', description: 'Hierarchy effective date', validationRule: 'YYYY-MM-DD' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Client / Entity',
        type: 'select',
        options: ['2COMS Services', 'Tata Consultancy Services', 'Cognizant Technology'],
        defaultValue: '2COMS Services',
        required: true
      }
    ],
    guidelines: [
      'Self-reporting loops (Manager = Employee) are strictly prohibited and rejected by validation.',
      'Circular reporting loops (A reports to B, B reports to A) will be flagged during pre-flight checks.',
      'Effective dates determine when approval workflows (leaves, overtime, timesheets) route to the new manager.'
    ],
    mockErrors: [
      { row: 9, identifier: 'DRFL044', field: 'L1_Manager_Code', value: 'DRFL044', reason: 'Self-reporting detected: An employee cannot be assigned as their own L1 Manager.', severity: 'Critical', suggestedFix: 'Assign valid distinct supervisor code' }
    ],
    defaultSuccessCount: 45,
    defaultErrorCount: 1,
    defaultWarningCount: 0
  },

  // --------------------------------------------------------------------------
  // 2. Master Data
  // --------------------------------------------------------------------------
  {
    id: 'business-vertical',
    name: 'Business Vertical Import',
    shortName: 'Business Vertical',
    category: 'Master Data',
    description: 'Import organizational business verticals, strategic profit centers, and executive business unit leaders.',
    badge: 'Entity Hierarchy',
    iconName: 'Network',
    templateFileName: 'Template_Business_Vertical.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Vertical_Code', 'Vertical_Name', 'Business_Unit', 'Head_of_Vertical_Emp_Code',
      'Head_of_Vertical_Name', 'Cost_Center_Code', 'Status'
    ],
    sampleRows: [
      {
        'Vertical_Code': 'BV-BFSI',
        'Vertical_Name': 'Banking, Financial Services & Insurance',
        'Business_Unit': 'Commercial Enterprise',
        'Head_of_Vertical_Emp_Code': 'EMP-101',
        'Head_of_Vertical_Name': 'Rajesh Raman',
        'Cost_Center_Code': 'CC-BFSI-01',
        'Status': 'Active'
      },
      {
        'Vertical_Code': 'BV-TECH',
        'Vertical_Name': 'Information Technology & Cloud Solutions',
        'Business_Unit': 'Technology Services',
        'Head_of_Vertical_Emp_Code': 'EMP-104',
        'Head_of_Vertical_Name': 'Swati Mukherjee',
        'Cost_Center_Code': 'CC-TECH-01',
        'Status': 'Active'
      }
    ],
    columns: [
      { name: 'Vertical Code', key: 'Vertical_Code', type: 'Text', required: true, sample: 'BV-BFSI', description: 'Unique identifier code', validationRule: 'Uppercase alphanumeric, unique' },
      { name: 'Vertical Name', key: 'Vertical_Name', type: 'Text', required: true, sample: 'Banking & Financial', description: 'Full business vertical title', validationRule: 'Min 3 chars' },
      { name: 'Head of Vertical Emp Code', key: 'Head_of_Vertical_Emp_Code', type: 'Text', required: true, sample: 'EMP-101', description: 'Assigned executive leader code', validationRule: 'Must be active employee' },
      { name: 'Status', key: 'Status', type: 'Enum', required: true, sample: 'Active', description: 'Operational status', validationRule: 'Active or Inactive' }
    ],
    contextFields: [
      {
        key: 'entity',
        label: 'Corporate Legal Entity',
        type: 'select',
        options: ['2COMS Consulting Pvt Ltd', '2COMS Services India Ltd', 'JobsForce Staffing LLP'],
        defaultValue: '2COMS Consulting Pvt Ltd',
        required: true
      }
    ],
    guidelines: [
      'Vertical codes must be unique across the organization.',
      'Head of Vertical must refer to an active employee record.'
    ],
    mockErrors: [
      { row: 4, identifier: 'BV-RETL', field: 'Vertical_Code', value: 'BV-RETL', reason: 'Duplicate code: Vertical code BV-RETL already exists in Master Registry.', severity: 'Critical', suggestedFix: 'Use unique vertical code' }
    ],
    defaultSuccessCount: 18,
    defaultErrorCount: 1,
    defaultWarningCount: 0
  },

  {
    id: 'category-master',
    name: 'Category Import',
    shortName: 'Category Master',
    category: 'Master Data',
    description: 'Bulk define employment categories, contract classifications (FTE, C2H, Trainee, Consultant), and policy groups.',
    badge: 'Policy Bands',
    iconName: 'Tag',
    templateFileName: 'Template_Category_Master.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Category_Code', 'Category_Name', 'Employment_Type', 'Notice_Period_Days',
      'Probation_Period_Months', 'Leave_Scheme_Applicable', 'PF_Applicable', 'ESI_Applicable'
    ],
    sampleRows: [
      {
        'Category_Code': 'CAT-FTE-ENG',
        'Category_Name': 'Full-Time Professional Engineering',
        'Employment_Type': 'Permanent Full-Time',
        'Notice_Period_Days': '90',
        'Probation_Period_Months': '6',
        'Leave_Scheme_Applicable': 'Standard Leave Policy 2026',
        'PF_Applicable': 'YES',
        'ESI_Applicable': 'NO'
      }
    ],
    columns: [
      { name: 'Category Code', key: 'Category_Code', type: 'Text', required: true, sample: 'CAT-FTE-ENG', description: 'Unique category identifier', validationRule: 'Alphanumeric' },
      { name: 'Category Name', key: 'Category_Name', type: 'Text', required: true, sample: 'Full-Time Engineering', description: 'Category title', validationRule: 'Min 3 chars' },
      { name: 'Notice Period Days', key: 'Notice_Period_Days', type: 'Number', required: true, sample: '90', description: 'Contractual notice duration', validationRule: 'Integer 0-180' }
    ],
    contextFields: [
      {
        key: 'entity',
        label: 'Legal Entity',
        type: 'select',
        options: ['2COMS Consulting Pvt Ltd', '2COMS Services India Ltd'],
        defaultValue: '2COMS Consulting Pvt Ltd',
        required: true
      }
    ],
    guidelines: [
      'Categories drive automated leave entitlement schemes and notice period defaults.',
      'Ensure statutory flags (PF, ESI) match state labor regulations.'
    ],
    mockErrors: [],
    defaultSuccessCount: 12,
    defaultErrorCount: 0,
    defaultWarningCount: 0
  },

  {
    id: 'department-master',
    name: 'Department Import',
    shortName: 'Department Master',
    category: 'Master Data',
    description: 'Import department structures, cost center associations, division links, and departmental heads.',
    badge: 'Org Structure',
    iconName: 'FolderTree',
    templateFileName: 'Template_Department_Master.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Department_Code', 'Department_Name', 'Parent_Division', 'HOD_Emp_Code',
      'Cost_Center', 'Approval_Routing_Level', 'Status'
    ],
    sampleRows: [
      {
        'Department_Code': 'DEPT-TECH',
        'Department_Name': 'Technology & Engineering',
        'Parent_Division': 'Digital Operations',
        'HOD_Emp_Code': 'EMP-102',
        'Cost_Center': 'CC-TECH-01',
        'Approval_Routing_Level': 'Level 2',
        'Status': 'Active'
      },
      {
        'Department_Code': 'DEPT-OPS',
        'Department_Name': 'Client Operations & Delivery',
        'Parent_Division': 'Service Delivery',
        'HOD_Emp_Code': 'EMP-108',
        'Cost_Center': 'CC-OPS-01',
        'Approval_Routing_Level': 'Level 1',
        'Status': 'Active'
      }
    ],
    columns: [
      { name: 'Department Code', key: 'Department_Code', type: 'Text', required: true, sample: 'DEPT-TECH', description: 'Unique department code', validationRule: 'Uppercase alphanumeric' },
      { name: 'Department Name', key: 'Department_Name', type: 'Text', required: true, sample: 'Technology & Engineering', description: 'Department display title', validationRule: 'Min 2 chars' },
      { name: 'Cost Center', key: 'Cost_Center', type: 'Text', required: true, sample: 'CC-TECH-01', description: 'Finance cost allocation key', validationRule: 'Must match Cost Center Master' }
    ],
    contextFields: [
      {
        key: 'entity',
        label: 'Entity / Client',
        type: 'select',
        options: ['All Entities (Global)', '2COMS Services', 'Tata Consultancy Services'],
        defaultValue: 'All Entities (Global)',
        required: true
      }
    ],
    guidelines: [
      'Department codes are referenced across candidate onboarding and timesheet modules.',
      'Active departments immediately become selectable in candidate entry forms.'
    ],
    mockErrors: [],
    defaultSuccessCount: 24,
    defaultErrorCount: 0,
    defaultWarningCount: 0
  },

  {
    id: 'job-role-master',
    name: 'Job Role / Designation Import',
    shortName: 'Job Role / Designation',
    category: 'Master Data',
    description: 'Import career architecture designations, job roles, salary grade bands, and required skill matrices.',
    badge: 'Designation Master',
    iconName: 'Briefcase',
    templateFileName: 'Template_Job_Role_Designations.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Designation_Code', 'Designation_Title', 'Department_Code', 'Grade_Band',
      'Min_Experience_Years', 'Standard_CTC_Min', 'Standard_CTC_Max', 'Status'
    ],
    sampleRows: [
      {
        'Designation_Code': 'DES-SDE2',
        'Designation_Title': 'Senior Software Engineer',
        'Department_Code': 'DEPT-TECH',
        'Grade_Band': 'B3 (Mid-Senior)',
        'Min_Experience_Years': '4.0',
        'Standard_CTC_Min': '800000',
        'Standard_CTC_Max': '1400000',
        'Status': 'Active'
      }
    ],
    columns: [
      { name: 'Designation Code', key: 'Designation_Code', type: 'Text', required: true, sample: 'DES-SDE2', description: 'Unique code', validationRule: 'Alphanumeric' },
      { name: 'Designation Title', key: 'Designation_Title', type: 'Text', required: true, sample: 'Senior Software Engineer', description: 'Official designation', validationRule: 'Min 3 chars' },
      { name: 'Grade Band', key: 'Grade_Band', type: 'Text', required: true, sample: 'B3', description: 'Compensation level band', validationRule: 'Valid band' }
    ],
    contextFields: [
      {
        key: 'department',
        label: 'Filter by Department',
        type: 'select',
        options: ['All Departments', 'Technology & Engineering', 'Operations', 'Finance', 'Human Resources'],
        defaultValue: 'All Departments',
        required: false
      }
    ],
    guidelines: [
      'Designations define standard salary bands and appraisal tiers.',
      'Must map to an existing department code.'
    ],
    mockErrors: [],
    defaultSuccessCount: 38,
    defaultErrorCount: 0,
    defaultWarningCount: 0
  },

  // --------------------------------------------------------------------------
  // 3. Attendance & Workforce
  // --------------------------------------------------------------------------
  {
    id: 'shift-roster',
    name: 'Roster / Shift Roster Import',
    shortName: 'Shift Roster',
    category: 'Attendance & Workforce',
    description: 'Bulk assign daily shifts and week-off schedules across months for entire employee cohorts and facility teams.',
    badge: 'Attendance Roster',
    iconName: 'CalendarCheck',
    templateFileName: 'Template_Shift_Roster_Monthly.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Employee_Code', 'Employee_Name', 'Location', 'Branch', 'Roster_Month',
      'Day_01', 'Day_02', 'Day_03', 'Day_04', 'Day_05', 'Day_06', 'Day_07',
      'Day_08', 'Day_09', 'Day_10', 'Day_11', 'Day_12', 'Day_13', 'Day_14',
      'Day_15', 'Day_16', 'Day_17', 'Day_18', 'Day_19', 'Day_20', 'Day_21',
      'Day_22', 'Day_23', 'Day_24', 'Day_25', 'Day_26', 'Day_27', 'Day_28',
      'Day_29', 'Day_30', 'Day_31'
    ],
    sampleRows: [
      {
        'Employee_Code': 'DRFL032',
        'Employee_Name': 'Noushad Mansurii',
        'Location': 'Hyderabad',
        'Branch': 'Home Branch',
        'Roster_Month': '2026-10',
        'Day_01': 'GS', 'Day_02': 'GS', 'Day_03': 'GS', 'Day_04': 'GS', 'Day_05': 'WO',
        'Day_06': 'WO', 'Day_07': 'GS', 'Day_08': 'GS', 'Day_09': 'GS', 'Day_10': 'GS',
        'Day_11': 'GS', 'Day_12': 'WO', 'Day_13': 'WO', 'Day_14': 'GS', 'Day_15': 'GS',
        'Day_16': 'GS', 'Day_17': 'GS', 'Day_18': 'GS', 'Day_19': 'WO', 'Day_20': 'WO',
        'Day_21': 'GS', 'Day_22': 'GS', 'Day_23': 'GS', 'Day_24': 'GS', 'Day_25': 'GS',
        'Day_26': 'WO', 'Day_27': 'WO', 'Day_28': 'GS', 'Day_29': 'GS', 'Day_30': 'GS',
        'Day_31': 'WO'
      }
    ],
    columns: [
      { name: 'Employee Code', key: 'Employee_Code', type: 'Text', required: true, sample: 'DRFL032', description: 'Assigned employee code', validationRule: 'Active staff code' },
      { name: 'Roster Month', key: 'Roster_Month', type: 'Text', required: true, sample: '2026-10', description: 'Format: YYYY-MM', validationRule: 'Valid Year-Month' },
      { name: 'Day Codes (Day_01 to Day_31)', key: 'Day_XX', type: 'Enum', required: true, sample: 'GS, MS, ES, WO', description: 'Valid shift codes: GS (General), MS (Morning), ES (Evening), WO (Weekoff)', validationRule: 'Must match Shift Master codes' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Client Account',
        type: 'select',
        options: ['2COMS Services', 'Tata Consultancy Services', 'Tech Mahindra', 'Cognizant Technology'],
        defaultValue: '2COMS Services',
        required: true
      },
      {
        key: 'location',
        label: 'Location',
        type: 'select',
        options: ['All Locations', 'Hyderabad', 'Bangalore', 'Kolkata', 'Pune'],
        defaultValue: 'Hyderabad',
        required: true
      },
      {
        key: 'branch',
        label: 'Branch',
        type: 'select',
        options: ['All Branches', 'Home Branch', 'HITEC City Unit 4', 'Gachibowli Operations'],
        defaultValue: 'Home Branch',
        required: true
      },
      {
        key: 'rosterPeriod',
        label: 'Target Roster Month',
        type: 'select',
        options: ['October 2026', 'November 2026', 'December 2026'],
        defaultValue: 'October 2026',
        required: true
      }
    ],
    guidelines: [
      'Shift codes must exist in the Shift Definition master (e.g., GS, MS, ES, NS, WO).',
      'Days that do not exist in the selected month (e.g. Day 31 in April) should be marked with a hyphen (-).',
      'Consecutive work periods must provide statutory weekly rest according to Factories Act.'
    ],
    mockErrors: [
      { row: 12, identifier: 'DRFL039', field: 'Day_14', value: 'XX', reason: 'Invalid shift code "XX". Only defined shift codes (GS, MS, ES, WO) are allowed.', severity: 'Critical', suggestedFix: 'Change to valid shift code like GS or WO' }
    ],
    defaultSuccessCount: 88,
    defaultErrorCount: 1,
    defaultWarningCount: 0
  },

  {
    id: 'leave-opening-balance',
    name: 'Leave Opening Balance Import',
    shortName: 'Leave Opening Balance',
    category: 'Attendance & Workforce',
    description: 'Credit initial leave balances, carried-forward earned leaves, casual leaves, and statutory accruals at financial year kickoff.',
    badge: 'Leave Quota',
    iconName: 'CalendarDays',
    templateFileName: 'Template_Leave_Opening_Balance_FY2627.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Employee_Code', 'Financial_Year', 'Earned_Leave_Balance', 'Casual_Leave_Balance',
      'Sick_Leave_Balance', 'Comp_Off_Balance', 'Maternity_Leave_Entitled', 'Remarks'
    ],
    sampleRows: [
      {
        'Employee_Code': 'DRFL032',
        'Financial_Year': '2026-2027',
        'Earned_Leave_Balance': '14.5',
        'Casual_Leave_Balance': '7.0',
        'Sick_Leave_Balance': '6.0',
        'Comp_Off_Balance': '2.0',
        'Maternity_Leave_Entitled': '0',
        'Remarks': 'FY26 Carry forward credited'
      }
    ],
    columns: [
      { name: 'Employee Code', key: 'Employee_Code', type: 'Text', required: true, sample: 'DRFL032', description: 'Active employee code', validationRule: 'Valid employee' },
      { name: 'Financial Year', key: 'Financial_Year', type: 'Text', required: true, sample: '2026-2027', description: 'Target FY', validationRule: 'Format: YYYY-YYYY' },
      { name: 'Earned Leave Balance', key: 'Earned_Leave_Balance', type: 'Number', required: true, sample: '14.5', description: 'Carried forward EL/PL', validationRule: 'Positive decimal, multiples of 0.5' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Client Account',
        type: 'select',
        options: ['2COMS Services', 'Tata Consultancy Services', 'Wipro Enterprise'],
        defaultValue: '2COMS Services',
        required: true
      },
      {
        key: 'financialYear',
        label: 'Financial Year',
        type: 'select',
        options: ['FY 2026-2027', 'FY 2025-2026'],
        defaultValue: 'FY 2026-2027',
        required: true
      }
    ],
    guidelines: [
      'Balances are credited in half-day multiples (0.5).',
      'Carried forward earned leave balances cannot exceed the policy statutory cap (typically 30 or 45 days).'
    ],
    mockErrors: [],
    defaultSuccessCount: 142,
    defaultErrorCount: 0,
    defaultWarningCount: 0
  },

  {
    id: 'raw-attendance-punch',
    name: 'Raw Attendance Punch Import',
    shortName: 'Raw Attendance Punch',
    category: 'Attendance & Workforce',
    description: 'Upload offline biometric fingerprint machine logs, access card swipes, or external turnstile punch logs for muster synchronization.',
    badge: 'Biometric Feeds',
    iconName: 'Fingerprint',
    templateFileName: 'Template_Raw_Attendance_Punches.csv',
    supportedFileFormats: ['.csv', '.txt', '.xlsx'],
    templateHeaders: [
      'Biometric_Machine_ID', 'Employee_Code', 'Punch_Timestamp', 'Punch_Direction',
      'Gate_Number', 'Verification_Mode', 'Raw_Log_Hash'
    ],
    sampleRows: [
      {
        'Biometric_Machine_ID': 'BioSec-HYD-01',
        'Employee_Code': '2C-8941',
        'Punch_Timestamp': '2026-08-25 09:02:14',
        'Punch_Direction': 'IN',
        'Gate_Number': 'Main Gate 1',
        'Verification_Mode': 'Face Recognition',
        'Raw_Log_Hash': 'a9b2c3d4e5f6'
      },
      {
        'Biometric_Machine_ID': 'BioSec-HYD-01',
        'Employee_Code': '2C-8941',
        'Punch_Timestamp': '2026-08-25 18:14:22',
        'Punch_Direction': 'OUT',
        'Gate_Number': 'Main Gate 1',
        'Verification_Mode': 'Face Recognition',
        'Raw_Log_Hash': 'f7e8d9c0b1a2'
      }
    ],
    columns: [
      { name: 'Biometric Machine ID', key: 'Biometric_Machine_ID', type: 'Text', required: true, sample: 'BioSec-HYD-01', description: 'Registered terminal hardware code', validationRule: 'Alphanumeric' },
      { name: 'Employee Code', key: 'Employee_Code', type: 'Text', required: true, sample: '2C-8941', description: 'Staff employee code', validationRule: 'Must match employee' },
      { name: 'Punch Timestamp', key: 'Punch_Timestamp', type: 'Text', required: true, sample: '2026-08-25 09:02:14', description: 'Timestamp: YYYY-MM-DD HH:mm:ss', validationRule: '24-hour timestamp' },
      { name: 'Punch Direction', key: 'Punch_Direction', type: 'Enum', required: true, sample: 'IN', description: 'Punch direction', validationRule: 'IN or OUT' }
    ],
    contextFields: [
      {
        key: 'deviceModel',
        label: 'Biometric Terminal Device',
        type: 'select',
        options: ['BioSec ZKTeco Terminal (HYD Gate 1)', 'Matrix Cosec Turnstile (BLR Hub)', 'Hikvision Face Terminal (KOL DC)', 'Generic CSV Biometric Stream'],
        defaultValue: 'BioSec ZKTeco Terminal (HYD Gate 1)',
        required: true
      },
      {
        key: 'location',
        label: 'Facility Location',
        type: 'select',
        options: ['Hyderabad - Home Branch', 'Bangalore SEZ', 'Kolkata Regional'],
        defaultValue: 'Hyderabad - Home Branch',
        required: true
      }
    ],
    guidelines: [
      'Timestamps must be recorded in 24-hour military format (YYYY-MM-DD HH:mm:ss).',
      'The muster calculation engine pairs IN and OUT punches automatically to compute effective hours.'
    ],
    mockErrors: [
      { row: 41, identifier: '2C-8999', field: 'Employee_Code', value: '2C-8999', reason: 'Unregistered RFID badge: Employee code 2C-8999 does not exist in active staff database.', severity: 'Critical', suggestedFix: 'Verify badge mapping with security admin' }
    ],
    defaultSuccessCount: 230,
    defaultErrorCount: 1,
    defaultWarningCount: 0
  },

  {
    id: 'holiday-calendar-import',
    name: 'Holiday Calendar Import',
    shortName: 'Holiday Calendar',
    category: 'Attendance & Workforce',
    description: 'Bulk upload statutory annual holiday lists, regional festive closures, optional holiday pools, and state gazette declarations.',
    badge: 'Gazette Calendar',
    iconName: 'SunMedium',
    templateFileName: 'Template_Holiday_Calendar_2026.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Calendar_Name', 'Calendar_Year', 'Holiday_Date', 'Holiday_Name',
      'Holiday_Type', 'Day_of_Week', 'Region_State', 'Is_Mandatory_Flag'
    ],
    sampleRows: [
      {
        'Calendar_Name': 'Kolkata Operations 2026',
        'Calendar_Year': '2026',
        'Holiday_Date': '2026-01-26',
        'Holiday_Name': 'Republic Day',
        'Holiday_Type': 'Mandatory',
        'Day_of_Week': 'Monday',
        'Region_State': 'West Bengal',
        'Is_Mandatory_Flag': 'YES'
      },
      {
        'Calendar_Name': 'Kolkata Operations 2026',
        'Calendar_Year': '2026',
        'Holiday_Date': '2026-10-20',
        'Holiday_Name': 'Durga Puja (Maha Nabami)',
        'Holiday_Type': 'Mandatory',
        'Day_of_Week': 'Tuesday',
        'Region_State': 'West Bengal',
        'Is_Mandatory_Flag': 'YES'
      },
      {
        'Calendar_Name': 'Kolkata Operations 2026',
        'Calendar_Year': '2026',
        'Holiday_Date': '2026-11-15',
        'Holiday_Name': 'Bhai Dooj',
        'Holiday_Type': 'Optional',
        'Day_of_Week': 'Sunday',
        'Region_State': 'West Bengal',
        'Is_Mandatory_Flag': 'NO'
      }
    ],
    columns: [
      { name: 'Calendar Name', key: 'Calendar_Name', type: 'Text', required: true, sample: 'Kolkata Operations 2026', description: 'Holiday calendar identifier', validationRule: 'Min 4 chars' },
      { name: 'Holiday Date', key: 'Holiday_Date', type: 'Date', required: true, sample: '2026-01-26', description: 'Date of observance', validationRule: 'YYYY-MM-DD' },
      { name: 'Holiday Name', key: 'Holiday_Name', type: 'Text', required: true, sample: 'Republic Day', description: 'Official celebration name', validationRule: 'Min 3 chars' },
      { name: 'Holiday Type', key: 'Holiday_Type', type: 'Enum', required: true, sample: 'Mandatory', description: 'Mandatory vs Optional', validationRule: 'Mandatory or Optional' }
    ],
    contextFields: [
      {
        key: 'calendarYear',
        label: 'Calendar Year',
        type: 'select',
        options: ['2026', '2027'],
        defaultValue: '2026',
        required: true
      },
      {
        key: 'region',
        label: 'Region / Operating State',
        type: 'select',
        options: ['West Bengal', 'Telangana', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'National (All-India)'],
        defaultValue: 'West Bengal',
        required: true
      }
    ],
    guidelines: [
      'Holidays marked Mandatory apply to all staff enrolled in the calendar.',
      'Holidays marked Optional feed into the employee choice pool.'
    ],
    mockErrors: [],
    defaultSuccessCount: 16,
    defaultErrorCount: 0,
    defaultWarningCount: 0
  },

  // --------------------------------------------------------------------------
  // 4. Payroll & Compensation
  // --------------------------------------------------------------------------
  {
    id: 'payslip-bulk',
    name: 'Payslip Bulk Import / Generation',
    shortName: 'Payslip Bulk Import',
    category: 'Payroll & Compensation',
    description: 'Upload itemized monthly payroll register containing earnings (Basic, HRA, Special Allowance) and deductions (PF, ESI, TDS) for payslip publication.',
    badge: 'Disbursement Hub',
    iconName: 'Receipt',
    templateFileName: 'Template_Monthly_Payslips_Aug2026.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Employee_Code', 'Pay_Month_Year', 'Paid_Days', 'LOP_Days', 'Basic_Salary',
      'House_Rent_Allowance', 'Special_Allowance', 'Gross_Earnings', 'Provident_Fund_EE',
      'ESI_EE', 'Professional_Tax', 'TDS_Income_Tax', 'Total_Deductions', 'Net_Payable'
    ],
    sampleRows: [
      {
        'Employee_Code': 'DRFL032',
        'Pay_Month_Year': '2026-08',
        'Paid_Days': '31.0',
        'LOP_Days': '0.0',
        'Basic_Salary': '30000',
        'House_Rent_Allowance': '15000',
        'Special_Allowance': '15000',
        'Gross_Earnings': '60000',
        'Provident_Fund_EE': '1800',
        'ESI_EE': '0',
        'Professional_Tax': '200',
        'TDS_Income_Tax': '1500',
        'Total_Deductions': '3500',
        'Net_Payable': '56500'
      }
    ],
    columns: [
      { name: 'Employee Code', key: 'Employee_Code', type: 'Text', required: true, sample: 'DRFL032', description: 'Assigned employee code', validationRule: 'Active employee' },
      { name: 'Pay Month Year', key: 'Pay_Month_Year', type: 'Text', required: true, sample: '2026-08', description: 'Pay period (YYYY-MM)', validationRule: 'YYYY-MM' },
      { name: 'Gross Earnings', key: 'Gross_Earnings', type: 'Number', required: true, sample: '60000', description: 'Total monthly earnings', validationRule: 'Basic + Allowances' },
      { name: 'Net Payable', key: 'Net_Payable', type: 'Number', required: true, sample: '56500', description: 'Gross minus Deductions', validationRule: 'Must match mathematical balance' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Client / Entity',
        type: 'select',
        options: ['2COMS Services', 'Tata Consultancy Services', 'Flipkart Internet Pvt Ltd'],
        defaultValue: '2COMS Services',
        required: true
      },
      {
        key: 'payPeriod',
        label: 'Payroll Processing Period',
        type: 'select',
        options: ['August 2026', 'September 2026', 'July 2026'],
        defaultValue: 'August 2026',
        required: true
      }
    ],
    guidelines: [
      'Mathematical integrity check: Net Payable must strictly equal Gross Earnings minus Total Deductions.',
      'Employees must have bank details or active penny-drop verification for NEFT payout generation.'
    ],
    mockErrors: [
      { row: 18, identifier: 'DRFL047', field: 'Net_Payable', value: '45000', reason: 'Arithmetic mismatch: Gross (50,000) minus Deductions (3,500) equals 46,500, but 45,000 was entered.', severity: 'Critical', suggestedFix: 'Recompute Net Payable to 46,500' }
    ],
    defaultSuccessCount: 141,
    defaultErrorCount: 1,
    defaultWarningCount: 0
  },

  {
    id: 'salary-annexure',
    name: 'Salary Annexure / Letter Builder Import',
    shortName: 'Salary Annexure',
    category: 'Payroll & Compensation',
    description: 'Bulk import revised CTC compensation structures, increment letters, promotion annexures, and variable pay matrices.',
    badge: 'Compensation Breakup',
    iconName: 'FileSpreadsheet',
    templateFileName: 'Template_Salary_Annexure_Revision.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Employee_Code', 'Annual_CTC', 'Monthly_Gross', 'Basic_Percentage',
      'HRA_Percentage', 'Retirals_PF_Employer', 'Gratuity_Annual', 'Medical_Insurance',
      'Performance_Bonus_Annual', 'Revision_Effective_Date'
    ],
    sampleRows: [
      {
        'Employee_Code': 'DRFL032',
        'Annual_CTC': '720000',
        'Monthly_Gross': '55000',
        'Basic_Percentage': '50',
        'HRA_Percentage': '25',
        'Retirals_PF_Employer': '21600',
        'Gratuity_Annual': '17300',
        'Medical_Insurance': '12000',
        'Performance_Bonus_Annual': '50000',
        'Revision_Effective_Date': '2026-10-01'
      }
    ],
    columns: [
      { name: 'Employee Code', key: 'Employee_Code', type: 'Text', required: true, sample: 'DRFL032', description: 'Active employee code', validationRule: 'Valid employee' },
      { name: 'Annual CTC', key: 'Annual_CTC', type: 'Number', required: true, sample: '720000', description: 'Total Cost to Company in INR', validationRule: 'Numeric' },
      { name: 'Revision Effective Date', key: 'Revision_Effective_Date', type: 'Date', required: true, sample: '2026-10-01', description: 'Effective date for letter generation', validationRule: 'YYYY-MM-DD' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Client Account',
        type: 'select',
        options: ['2COMS Services', 'Tata Consultancy Services', 'Tech Mahindra'],
        defaultValue: '2COMS Services',
        required: true
      },
      {
        key: 'letterType',
        label: 'Annexure Document Type',
        type: 'select',
        options: ['Annual Appraisal Letter (FY26)', 'Promotion Annexure', 'Contract Renewal CTC Breakdown'],
        defaultValue: 'Annual Appraisal Letter (FY26)',
        required: true
      }
    ],
    guidelines: [
      'Component breakdown must reconcile with legal CTC definitions.',
      'Upon import completion, automated digital letters will be staged in the candidate letter builder.'
    ],
    mockErrors: [],
    defaultSuccessCount: 65,
    defaultErrorCount: 0,
    defaultWarningCount: 0
  },

  // --------------------------------------------------------------------------
  // 5. Client Setup
  // --------------------------------------------------------------------------
  {
    id: 'client-location-import',
    name: 'Client Location Import',
    shortName: 'Client Location',
    category: 'Client Setup',
    description: 'Bulk register regional operating cities, states, statutory GSTIN credentials, and commercial client campuses.',
    badge: 'Multi-Location Topology',
    iconName: 'MapPin',
    templateFileName: 'Template_Client_Location_Master.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Client_Code', 'Client_Name', 'Location_Code', 'Location_Name',
      'City', 'State', 'Pincode', 'GSTIN_Number', 'Contact_Person', 'Contact_Email'
    ],
    sampleRows: [
      {
        'Client_Code': '2CS',
        'Client_Name': '2COMS Services',
        'Location_Code': 'LOC-HYD',
        'Location_Name': 'Hyderabad Regional Center',
        'City': 'Hyderabad',
        'State': 'Telangana',
        'Pincode': '500081',
        'GSTIN_Number': '36AAACC1234F1Z5',
        'Contact_Person': 'Ravi Teja',
        'Contact_Email': 'ravi.teja@2coms.com'
      },
      {
        'Client_Code': '2CS',
        'Client_Name': '2COMS Services',
        'Location_Code': 'LOC-KOL',
        'Location_Name': 'Kolkata Headquarters',
        'City': 'Kolkata',
        'State': 'West Bengal',
        'Pincode': '700091',
        'GSTIN_Number': '19AAACC1234F1Z8',
        'Contact_Person': 'Suman Das',
        'Contact_Email': 'suman.das@2coms.com'
      }
    ],
    columns: [
      { name: 'Client Code', key: 'Client_Code', type: 'Text', required: true, sample: '2CS', description: 'Assigned client master code', validationRule: 'Must match Client' },
      { name: 'Location Code', key: 'Location_Code', type: 'Text', required: true, sample: 'LOC-HYD', description: 'Unique location code', validationRule: 'Alphanumeric' },
      { name: 'State', key: 'State', type: 'Text', required: true, sample: 'Telangana', description: 'Indian State / UT', validationRule: 'Valid State' },
      { name: 'GSTIN Number', key: 'GSTIN_Number', type: 'Text', required: false, sample: '36AAACC1234F1Z5', description: '15-character GSTIN', validationRule: 'Valid 15-char GSTIN syntax' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Client Organization',
        type: 'select',
        options: ['2COMS Services', 'Tata Consultancy Services', 'Tech Mahindra', 'Cognizant Technology', 'Wipro Enterprise', 'Infosys BPM'],
        defaultValue: '2COMS Services',
        required: true
      }
    ],
    guidelines: [
      'Each client can have multiple locations across India.',
      'State jurisdiction determines applicable Professional Tax (PT) and Labor Welfare Fund (LWF) slabs.'
    ],
    mockErrors: [
      { row: 5, identifier: 'LOC-BLR', field: 'GSTIN_Number', value: '29ABC123', reason: 'Invalid GSTIN length: must be 15 characters (State code + PAN + entity + checksum).', severity: 'Critical', suggestedFix: 'Verify state 15-character GSTIN format' }
    ],
    defaultSuccessCount: 15,
    defaultErrorCount: 1,
    defaultWarningCount: 0
  },

  {
    id: 'branch-mapping-import',
    name: 'Branch / Location Mapping Import',
    shortName: 'Branch Mapping',
    category: 'Client Setup',
    description: 'Bulk configure operational branch offices under client locations, physical facility addresses, and attendance geo-fence radiuses.',
    badge: 'Branch Hierarchy',
    iconName: 'Building',
    templateFileName: 'Template_Branch_Location_Mapping.xlsx',
    supportedFileFormats: ['.xlsx', '.csv'],
    templateHeaders: [
      'Client_Code', 'Location_Code', 'Branch_Code', 'Branch_Name',
      'Address_Line_1', 'City', 'Latitude', 'Longitude', 'Geofence_Radius_Meters', 'Status'
    ],
    sampleRows: [
      {
        'Client_Code': '2CS',
        'Location_Code': 'LOC-HYD',
        'Branch_Code': 'HYD-01',
        'Branch_Name': 'Home Branch',
        'Address_Line_1': 'Cyber Gateway, Phase II, Madhapur',
        'City': 'Hyderabad',
        'Latitude': '17.4483',
        'Longitude': '78.3742',
        'Geofence_Radius_Meters': '250',
        'Status': 'Active'
      },
      {
        'Client_Code': '2CS',
        'Location_Code': 'LOC-HYD',
        'Branch_Code': 'HYD-02',
        'Branch_Name': 'HITEC City Unit 4',
        'Address_Line_1': 'Building 12B, Mindspace SEZ',
        'City': 'Hyderabad',
        'Latitude': '17.4399',
        'Longitude': '78.3807',
        'Geofence_Radius_Meters': '300',
        'Status': 'Active'
      }
    ],
    columns: [
      { name: 'Location Code', key: 'Location_Code', type: 'Text', required: true, sample: 'LOC-HYD', description: 'Parent location code', validationRule: 'Must match existing location' },
      { name: 'Branch Code', key: 'Branch_Code', type: 'Text', required: true, sample: 'HYD-01', description: 'Branch office code', validationRule: 'Alphanumeric' },
      { name: 'Branch Name', key: 'Branch_Name', type: 'Text', required: true, sample: 'Home Branch', description: 'Operational branch name', validationRule: 'Min 2 chars' },
      { name: 'Geofence Radius Meters', key: 'Geofence_Radius_Meters', type: 'Number', required: true, sample: '250', description: 'Permissible punch radius in meters', validationRule: 'Between 50 and 5000' }
    ],
    contextFields: [
      {
        key: 'client',
        label: 'Client Organization',
        type: 'select',
        options: ['2COMS Services', 'Tata Consultancy Services', 'Tech Mahindra', 'Cognizant Technology'],
        defaultValue: '2COMS Services',
        required: true
      },
      {
        key: 'location',
        label: 'Parent Location',
        type: 'select',
        options: ['All Locations', 'Hyderabad', 'Bangalore', 'Kolkata'],
        defaultValue: 'Hyderabad',
        required: true
      }
    ],
    guidelines: [
      'Each location can have multiple operational branches.',
      'Geofence coordinates power the mobile attendance punch radius enforcement.'
    ],
    mockErrors: [],
    defaultSuccessCount: 22,
    defaultErrorCount: 0,
    defaultWarningCount: 0
  }
];

export const INITIAL_IMPORT_LOGS: ExtendedImportLog[] = [
  {
    id: 'BATCH-2026-904',
    importTypeId: 'candidate-registration',
    importTypeName: 'Candidate Registration',
    category: 'Candidate Lifecycle',
    fileName: 'TCS_Campus_Batch_Sep2026_Final.xlsx',
    clientOrEntity: 'Tata Consultancy Services',
    uploadedBy: 'Ananya Mukherjee (Ops Lead)',
    uploadedOn: 'Today, 04:30 PM',
    totalRows: 64,
    insertedRows: 59,
    failedRows: 4,
    warningsCount: 1,
    status: 'Partially Completed',
    errorReportUrl: '#download-errors-904'
  },
  {
    id: 'BATCH-2026-903',
    importTypeId: 'shift-roster',
    importTypeName: 'Roster / Shift Roster',
    category: 'Attendance & Workforce',
    fileName: 'Roster_Oct2026_Hyderabad_HomeBranch.xlsx',
    clientOrEntity: '2COMS Services',
    uploadedBy: 'Ravi Teja (HR Ops)',
    uploadedOn: 'Today, 02:15 PM',
    totalRows: 48,
    insertedRows: 48,
    failedRows: 0,
    warningsCount: 0,
    status: 'Completed'
  },
  {
    id: 'BATCH-2026-902',
    importTypeId: 'leave-opening-balance',
    importTypeName: 'Leave Opening Balance',
    category: 'Attendance & Workforce',
    fileName: 'Opening_Leave_Balances_FY2627_AllStaff.xlsx',
    clientOrEntity: '2COMS Services',
    uploadedBy: 'Deepak Rao (Admin)',
    uploadedOn: 'Yesterday, 05:40 PM',
    totalRows: 142,
    insertedRows: 142,
    failedRows: 0,
    warningsCount: 0,
    status: 'Completed'
  },
  {
    id: 'BATCH-2026-901',
    importTypeId: 'payslip-bulk',
    importTypeName: 'Payslip Bulk Import',
    category: 'Payroll & Compensation',
    fileName: 'August_2026_Disbursement_Payroll_Register.xlsx',
    clientOrEntity: '2COMS Services',
    uploadedBy: 'Kavita Nair (Finance Lead)',
    uploadedOn: '28 Sep 2026, 11:20 AM',
    totalRows: 142,
    insertedRows: 141,
    failedRows: 1,
    warningsCount: 0,
    status: 'Partially Completed',
    errorReportUrl: '#download-errors-901'
  },
  {
    id: 'BATCH-2026-900',
    importTypeId: 'branch-mapping-import',
    importTypeName: 'Branch / Location Mapping',
    category: 'Client Setup',
    fileName: 'Telangana_Branches_Geofence_Coords.xlsx',
    clientOrEntity: '2COMS Services',
    uploadedBy: 'Deepak Rao (Admin)',
    uploadedOn: '25 Sep 2026, 03:10 PM',
    totalRows: 12,
    insertedRows: 12,
    failedRows: 0,
    warningsCount: 0,
    status: 'Completed'
  },
  {
    id: 'BATCH-2026-899',
    importTypeId: 'holiday-calendar-import',
    importTypeName: 'Holiday Calendar Import',
    category: 'Attendance & Workforce',
    fileName: 'West_Bengal_Gazette_Holidays_2026.xlsx',
    clientOrEntity: '2COMS Services',
    uploadedBy: 'Anik Bandopadhyay (Tech)',
    uploadedOn: '22 Sep 2026, 10:00 AM',
    totalRows: 16,
    insertedRows: 16,
    failedRows: 0,
    warningsCount: 0,
    status: 'Completed'
  }
];
