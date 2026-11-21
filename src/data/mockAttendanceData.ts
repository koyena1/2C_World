export interface ClientBranch {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
  staffCount: number;
}

export interface ClientLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  branches: ClientBranch[];
}

export interface EnterpriseClientHierarchy {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
  locations: ClientLocation[];
}

export const CLIENT_HIERARCHIES: EnterpriseClientHierarchy[] = [
  {
    id: 'client-2coms',
    name: '2COMS Services',
    code: '2CS',
    status: 'Active',
    locations: [
      {
        id: 'loc-hyd',
        name: 'Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        branches: [
          { id: 'br-hyd-city', name: 'Hyderabad (City Level)', code: 'HYD-01', status: 'Active', staffCount: 100 },
        ],
      },
      {
        id: 'loc-kol',
        name: 'Kolkata',
        city: 'Kolkata',
        state: 'West Bengal',
        branches: [
          { id: 'br-kol-rdb', name: 'RDB', code: 'KOL-RDB', status: 'Active', staffCount: 48 },
          { id: 'br-kol-bbg', name: 'Big Bagan', code: 'KOL-BBG', status: 'Active', staffCount: 32 },
          { id: 'br-kol-alp', name: 'Alipore', code: 'KOL-ALP', status: 'Active', staffCount: 26 },
        ],
      },
      {
        id: 'loc-blr',
        name: 'Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        branches: [
          { id: 'br-blr-city', name: 'Bangalore (City Level)', code: 'BLR-01', status: 'Active', staffCount: 61 },
        ],
      },
    ],
  },
  {
    id: 'client-tcs',
    name: 'Tata Consultancy Services',
    code: 'TCS',
    status: 'Active',
    locations: [
      {
        id: 'loc-tcs-blr',
        name: 'Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        branches: [
          { id: 'br-tcs-sez', name: 'SEZ Phase 1', code: 'TCS-BLR-01', status: 'Active', staffCount: 124 },
          { id: 'br-tcs-wf', name: 'Whitefield Campus', code: 'TCS-BLR-02', status: 'Active', staffCount: 96 },
          { id: 'br-tcs-ec', name: 'Electronic City Gate 2', code: 'TCS-BLR-03', status: 'Active', staffCount: 75 },
        ],
      },
      {
        id: 'loc-tcs-hyd',
        name: 'Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        branches: [
          { id: 'br-tcs-adib', name: 'Adibatla Aerospace SEZ', code: 'TCS-HYD-01', status: 'Active', staffCount: 88 },
          { id: 'br-tcs-syn', name: 'Synergy Park Unit 1', code: 'TCS-HYD-02', status: 'Active', staffCount: 65 },
        ],
      },
      {
        id: 'loc-tcs-pune',
        name: 'Pune',
        city: 'Pune',
        state: 'Maharashtra',
        branches: [
          { id: 'br-tcs-sahy', name: 'Sahyadri Park', code: 'TCS-PUN-01', status: 'Active', staffCount: 110 },
          { id: 'br-tcs-hinj', name: 'Hinjewadi Phase 3', code: 'TCS-PUN-02', status: 'Active', staffCount: 82 },
        ],
      },
    ],
  },
  {
    id: 'client-techm',
    name: 'Tech Mahindra',
    code: 'TECHM',
    status: 'Active',
    locations: [
      {
        id: 'loc-tm-pune',
        name: 'Pune',
        city: 'Pune',
        state: 'Maharashtra',
        branches: [
          { id: 'br-tm-hinj', name: 'Hinjewadi Campus', code: 'TM-PUN-01', status: 'Active', staffCount: 62 },
          { id: 'br-tm-vim', name: 'Viman Nagar DC', code: 'TM-PUN-02', status: 'Active', staffCount: 40 },
        ],
      },
      {
        id: 'loc-tm-hyd',
        name: 'Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        branches: [
          { id: 'br-tm-info', name: 'Infocity Campus', code: 'TM-HYD-01', status: 'Active', staffCount: 55 },
          { id: 'br-tm-bah', name: 'Bahadurpally Hub', code: 'TM-HYD-02', status: 'Active', staffCount: 30 },
        ],
      },
    ],
  },
  {
    id: 'client-cts',
    name: 'Cognizant Technology',
    code: 'CTSH',
    status: 'Active',
    locations: [
      {
        id: 'loc-cts-chn',
        name: 'Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        branches: [
          { id: 'br-cts-mepz', name: 'MEPZ Branch', code: 'CTS-CHN-01', status: 'Active', staffCount: 89 },
          { id: 'br-cts-omr', name: 'Thoraipakkam OMR', code: 'CTS-CHN-02', status: 'Active', staffCount: 60 },
          { id: 'br-cts-sip', name: 'Siruseri SIPCOT', code: 'CTS-CHN-03', status: 'Active', staffCount: 45 },
        ],
      },
      {
        id: 'loc-cts-kol',
        name: 'Kolkata',
        city: 'Kolkata',
        state: 'West Bengal',
        branches: [
          { id: 'br-cts-ban', name: 'Bantala SEZ', code: 'CTS-KOL-01', status: 'Active', staffCount: 78 },
          { id: 'br-cts-sec5', name: 'Salt Lake Sector V', code: 'CTS-KOL-02', status: 'Active', staffCount: 52 },
        ],
      },
    ],
  },
  {
    id: 'client-wipro',
    name: 'Wipro Enterprise',
    code: 'WIT',
    status: 'Active',
    locations: [
      {
        id: 'loc-wip-hyd',
        name: 'Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        branches: [
          { id: 'br-wip-gach', name: 'Gachibowli Unit 2', code: 'WIP-HYD-01', status: 'Active', staffCount: 54 },
          { id: 'br-wip-man', name: 'Manikonda DC', code: 'WIP-HYD-02', status: 'Active', staffCount: 38 },
        ],
      },
      {
        id: 'loc-wip-blr',
        name: 'Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        branches: [
          { id: 'br-wip-sar', name: 'Sarjapur Campus', code: 'WIP-BLR-01', status: 'Active', staffCount: 95 },
          { id: 'br-wip-ec', name: 'Electronic City Tower 3', code: 'WIP-BLR-02', status: 'Active', staffCount: 70 },
        ],
      },
    ],
  },
  {
    id: 'client-infosys',
    name: 'Infosys BPM',
    code: 'INFY',
    status: 'Active',
    locations: [
      {
        id: 'loc-inf-kol',
        name: 'Kolkata',
        city: 'Kolkata',
        state: 'West Bengal',
        branches: [
          { id: 'br-inf-sec5', name: 'Salt Lake Sector V', code: 'INF-KOL-01', status: 'Active', staffCount: 76 },
          { id: 'br-inf-nt', name: 'New Town Rajarhat', code: 'INF-KOL-02', status: 'Active', staffCount: 48 },
        ],
      },
      {
        id: 'loc-inf-pune',
        name: 'Pune',
        city: 'Pune',
        state: 'Maharashtra',
        branches: [
          { id: 'br-inf-ph2', name: 'Hinjewadi Phase 2', code: 'INF-PUN-01', status: 'Active', staffCount: 84 },
          { id: 'br-inf-tal', name: 'Talawade SEZ', code: 'INF-PUN-02', status: 'Active', staffCount: 42 },
        ],
      },
    ],
  },
];

export interface AttendanceClientProfile {
  id: string;
  name: string;
  code: string;
  location: string;
  state: string;
  city: string;
  branch: string;
  status: 'Active' | 'Inactive' | 'Onboarding';
  employeeCount: number;
}

export const ATTENDANCE_CLIENTS: AttendanceClientProfile[] = [
  {
    id: 'client-2coms',
    name: '2COMS Services',
    code: '2CS',
    location: 'Hyderabad',
    state: 'Telangana',
    city: 'Hyderabad',
    branch: 'Home Branch',
    status: 'Active',
    employeeCount: 48,
  },
  {
    id: 'client-tcs',
    name: 'Tata Consultancy Services',
    code: 'TCS',
    location: 'Bangalore',
    state: 'Karnataka',
    city: 'Bangalore',
    branch: 'SEZ Phase 1',
    status: 'Active',
    employeeCount: 124,
  },
  {
    id: 'client-techm',
    name: 'Tech Mahindra',
    code: 'TECHM',
    location: 'Pune',
    state: 'Maharashtra',
    city: 'Pune',
    branch: 'Hinjewadi Campus',
    status: 'Active',
    employeeCount: 62,
  },
  {
    id: 'client-cts',
    name: 'Cognizant Technology',
    code: 'CTSH',
    location: 'Chennai',
    state: 'Tamil Nadu',
    city: 'Chennai',
    branch: 'MEPZ Branch',
    status: 'Active',
    employeeCount: 89,
  },
  {
    id: 'client-wipro',
    name: 'Wipro Enterprise',
    code: 'WIT',
    location: 'Hyderabad',
    state: 'Telangana',
    city: 'Hyderabad',
    branch: 'Gachibowli Unit 2',
    status: 'Active',
    employeeCount: 54,
  },
  {
    id: 'client-infosys',
    name: 'Infosys BPM',
    code: 'INFY',
    location: 'Kolkata',
    state: 'West Bengal',
    city: 'Kolkata',
    branch: 'Salt Lake Sector V',
    status: 'Active',
    employeeCount: 76,
  },
];

export interface AttendanceCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'Monthly' | 'Fortnightly' | 'Weekly' | 'Custom';
  status: 'Open' | 'Locked' | 'Active';
  isActive: boolean;
  lockDate: string; // 'Not Locked' or date string
  employeeCount: number;
  clientId?: string;
  clientName?: string;
  locationId?: string;
  locationName?: string;
  branchId?: string;
  branchName?: string;
}

export interface EmployeeAttendanceSummary {
  id: string;
  empCode: string;
  name: string;
  department: string;
  present: number;
  absent: number;
  leave: number;
  lateDays: number;
  attendancePct: number;
  isMyTeam: boolean;
  dailyRecords: DailyAttendanceRecord[];
}

export interface DailyAttendanceRecord {
  id: string;
  date: string;
  day: string;
  location: string;
  status: 'Present' | 'Absent' | 'Holiday' | 'Weekend' | 'Not Marked';
  holidayName?: string;
  inTime: string;
  outTime: string;
  totalHours: string;
  lateMins: string;
}

// Submodule 2: Shifts & Shift Muster
export interface ShiftDefinition {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: string;
  effectiveWorkHours: string;
  graceTimeMins: number;
  halfDayThreshold: string;
  status: 'Active' | 'Inactive';
  assignedEmployees: number;
  isDefault?: boolean;
}

// Submodule 3: Weekoff Patterns
export interface WeekoffPattern {
  id: string;
  name: string;
  description: string;
  applicableDays: string[];
  saturdayRule: 'All Saturdays Off' | '2nd & 4th Saturday Off' | '1st & 3rd Saturday Off' | 'All Saturdays Working';
  sundayRule: 'All Sundays Off' | 'Working';
  assignedCount: number;
  isDefault: boolean;
  status: 'Active' | 'Inactive';
}

// Submodule 4: Roster
export interface RosterEmployeeRow {
  id: string;
  empCode: string;
  name: string;
  department: string;
  designation?: string;
  location: string;
  email?: string;
  contact?: string;
  aadhaar?: string;
  workMode: 'wfh' | 'office' | 'hybrid' | 'Not Set';
  currentShift?: string;
  currentShiftName?: string;
  currentShiftCode?: string;
  weekoffPattern?: string;
  weekoffPatternName?: string;
  isDefaultShift?: boolean;
  assignmentStatus?: 'Assigned' | 'Unassigned';
  // Day-wise shift code e.g. { '01': 'MS', '02': 'MS', '03': 'WO', '04': 'L', ... }
  shiftsByDay: Record<string, string>;
}

// Kolkata Permitted Work Locations Hierarchy
export interface KolkataPermittedOffice {
  id: string;
  name: 'RDB' | 'Big Bagan' | 'Alipore';
  city: 'Kolkata';
  workZone: 'Kolkata';
  pincodeAddressPlaceholder: string;
  geoFenceStatus: 'Active (Geofenced)' | 'Configured';
  attendanceAllowed: string;
  enrolledStaffCount: number;
  geofenceRadiusMeters: number;
}

export const KOLKATA_PERMITTED_OFFICES: KolkataPermittedOffice[] = [
  {
    id: 'kol-off-rdb',
    name: 'RDB',
    city: 'Kolkata',
    workZone: 'Kolkata',
    pincodeAddressPlaceholder: 'RDB Boulevard, Block EP & GP, Sector V, Bidhannagar, Kolkata 700091 [Placeholder]',
    geoFenceStatus: 'Active (Geofenced)',
    attendanceAllowed: 'Yes (Permitted for all Kolkata employees)',
    enrolledStaffCount: 48,
    geofenceRadiusMeters: 200,
  },
  {
    id: 'kol-off-bbg',
    name: 'Big Bagan',
    city: 'Kolkata',
    workZone: 'Kolkata',
    pincodeAddressPlaceholder: 'Big Bagan Commercial Zone, VIP Road / Kankurgachi, Kolkata 700054 [Placeholder]',
    geoFenceStatus: 'Active (Geofenced)',
    attendanceAllowed: 'Yes (Permitted for all Kolkata employees)',
    enrolledStaffCount: 32,
    geofenceRadiusMeters: 250,
  },
  {
    id: 'kol-off-alp',
    name: 'Alipore',
    city: 'Kolkata',
    workZone: 'Kolkata',
    pincodeAddressPlaceholder: 'Alipore Corporate Park, Belvedere Road, Kolkata 700027 [Placeholder]',
    geoFenceStatus: 'Active (Geofenced)',
    attendanceAllowed: 'Yes (Permitted for all Kolkata employees)',
    enrolledStaffCount: 26,
    geofenceRadiusMeters: 200,
  },
];

// Submodule 5: Daily Muster Log Entry
export interface DailyMusterLogEntry {
  id: string;
  empCode: string;
  name: string;
  department: string;
  location: string;
  workZone: string; // e.g. 'Kolkata', 'Hyderabad', 'Bangalore'
  mappedLocation: string; // e.g. 'Kolkata / RDB'
  mappedOffice: string; // e.g. 'RDB'
  punchedLocation: string; // e.g. 'Big Bagan'
  punchedOffice: string; // e.g. 'Big Bagan'
  validationResult: 'Accepted: Same Office' | 'Accepted: Permitted Kolkata Office' | 'Rejected: Outside Permitted Location' | 'City-level Approved' | 'Pending Punch';
  validationReason?: string;
  date: string;
  shiftCode: string;
  shiftTiming: string;
  inTime: string;
  outTime: string;
  totalHours: string;
  lateMins: string;
  earlyExitMins: string;
  punchSource: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Holiday' | 'Weekly Off';
  deviceInfo: string;
  regularizationStatus?: 'None' | 'Pending' | 'Approved';
  isMyTeam: boolean;
}

// Submodule 6: Geo Fence
export interface GeoFenceLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  enforcementMode: 'Strict (Block Outside)' | 'Warning (Allow with Flag)' | 'Audit Log Only';
  allowedWifiSSID: string;
  allowedIPSubnet: string;
  enrolledStaff: number;
  status: 'Active' | 'Inactive';
  lastActivity: string;
}

// Submodule 7: Holidays
export interface HolidayItem {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  type: 'Mandatory National' | 'State Specific' | 'Restricted / Optional (RH)';
  applicableBranch: string;
  isPaid: boolean;
  year: number;
}

// Submodule 8: Overtime Config & Records
export interface OvertimeConfigSettings {
  minQualifyingMinutes: number;
  rateMultiplierWeekday: number;
  rateMultiplierWeekend: number;
  rateMultiplierHoliday: number;
  dailyMaxOtHours: number;
  monthlyMaxOtHours: number;
  requirePreApproval: boolean;
  allowCompOffConversion: boolean;
  autoRoundOffMinutes: number;
}

export interface OvertimeLogRecord {
  id: string;
  empCode: string;
  name: string;
  department: string;
  date: string;
  shiftTiming: string;
  shiftHours: string;
  actualPunchHours: string;
  otDuration: string;
  rateType: 'Weekday 1.5x' | 'Weekend 2.0x' | 'Holiday 2.0x';
  calculatedPayout: number;
  status: 'Approved' | 'Pending Supervisor Approval' | 'Rejected' | 'Converted to Comp-Off';
  approver: string;
}

// --- INITIAL DATA ---

export const INITIAL_CYCLES: AttendanceCycle[] = [
  {
    id: 'cycle-kol-aug-2026',
    name: 'Kolkata Work Zone August 2026 Cycle',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    type: 'Monthly',
    status: 'Open',
    isActive: true,
    lockDate: 'Not Locked',
    employeeCount: 106,
    clientId: 'client-2coms',
    clientName: '2COMS Services',
    locationId: 'loc-kol',
    locationName: 'Kolkata',
    branchId: 'all',
    branchName: 'All Kolkata Offices (RDB, Big Bagan, Alipore)'
  },
  {
    id: 'cycle-aug-2026',
    name: 'August 2026 Cycle',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    type: 'Monthly',
    status: 'Open',
    isActive: true,
    lockDate: 'Not Locked',
    employeeCount: 48,
    clientId: 'client-2coms',
    clientName: '2COMS Services',
    locationId: 'loc-hyd',
    locationName: 'Hyderabad',
    branchId: 'br-hyd-home',
    branchName: 'Home Branch'
  },
  {
    id: 'cycle-jul-2026',
    name: 'July 2026 Cycle',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    type: 'Monthly',
    status: 'Locked',
    isActive: false,
    lockDate: '2026-08-02',
    employeeCount: 48,
    clientId: 'client-2coms',
    clientName: '2COMS Services',
    locationId: 'loc-hyd',
    locationName: 'Hyderabad',
    branchId: 'br-hyd-home',
    branchName: 'Home Branch'
  },
  {
    id: 'cycle-jun-2026',
    name: 'June 2026 Cycle',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    type: 'Monthly',
    status: 'Locked',
    isActive: false,
    lockDate: '2026-07-03',
    employeeCount: 46,
    clientId: 'client-2coms',
    clientName: '2COMS Services',
    locationId: 'loc-hyd',
    locationName: 'Hyderabad',
    branchId: 'br-hyd-home',
    branchName: 'Home Branch'
  },
  {
    id: 'cycle-tcs-aug-2026',
    name: 'TCS Bangalore August 2026 Cycle',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    type: 'Monthly',
    status: 'Open',
    isActive: false,
    lockDate: 'Not Locked',
    employeeCount: 124,
    clientId: 'client-tcs',
    clientName: 'Tata Consultancy Services',
    locationId: 'loc-tcs-blr',
    locationName: 'Bangalore',
    branchId: 'br-tcs-sez',
    branchName: 'SEZ Phase 1'
  },
  {
    id: 'cycle-techm-aug-2026',
    name: 'Tech Mahindra Pune August 2026 Cycle',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    type: 'Monthly',
    status: 'Open',
    isActive: false,
    lockDate: 'Not Locked',
    employeeCount: 62,
    clientId: 'client-techm',
    clientName: 'Tech Mahindra',
    locationId: 'loc-tm-pune',
    locationName: 'Pune',
    branchId: 'br-tm-hinj',
    branchName: 'Hinjewadi Campus'
  },
  {
    id: 'cycle-may-2026',
    name: 'May 2026 Cycle',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    type: 'Monthly',
    status: 'Locked',
    isActive: false,
    lockDate: '2026-06-02',
    employeeCount: 44,
    clientId: 'client-2coms',
    clientName: '2COMS Services',
    locationId: 'loc-hyd',
    locationName: 'Hyderabad',
    branchId: 'br-hyd-home',
    branchName: 'Home Branch'
  },
];

export const INITIAL_SHIFTS: ShiftDefinition[] = [
  {
    id: 'shift-1',
    code: 'GS',
    name: 'General Shift',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    breakDuration: '01h 00m',
    effectiveWorkHours: '08h 00m',
    graceTimeMins: 15,
    halfDayThreshold: '04h 30m',
    status: 'Active',
    assignedEmployees: 86,
    isDefault: true,
  },
  {
    id: 'shift-2',
    code: 'MS',
    name: 'Morning Shift',
    startTime: '07:00 AM',
    endTime: '03:30 PM',
    breakDuration: '00h 45m',
    effectiveWorkHours: '07h 45m',
    graceTimeMins: 10,
    halfDayThreshold: '04h 00m',
    status: 'Active',
    assignedEmployees: 32,
  },
  {
    id: 'shift-3',
    code: 'ES',
    name: 'Evening Shift',
    startTime: '03:00 PM',
    endTime: '11:30 PM',
    breakDuration: '00h 45m',
    effectiveWorkHours: '07h 45m',
    graceTimeMins: 10,
    halfDayThreshold: '04h 00m',
    status: 'Active',
    assignedEmployees: 18,
  },
  {
    id: 'shift-4',
    code: 'NS',
    name: 'Night Shift',
    startTime: '11:00 PM',
    endTime: '07:30 AM',
    breakDuration: '01h 00m',
    effectiveWorkHours: '07h 30m',
    graceTimeMins: 15,
    halfDayThreshold: '04h 00m',
    status: 'Active',
    assignedEmployees: 6,
  },
];

export const INITIAL_WEEKOFF_PATTERNS: WeekoffPattern[] = [
  {
    id: 'wo-1',
    name: '5-Day Standard (Saturday & Sunday Off)',
    description: 'Corporate corporate office working schedule with every weekend fully off.',
    applicableDays: ['Saturday', 'Sunday'],
    saturdayRule: 'All Saturdays Off',
    sundayRule: 'All Sundays Off',
    assignedCount: 94,
    isDefault: true,
    status: 'Active',
  },
  {
    id: 'wo-2',
    name: 'Alternate Saturday Off (2nd & 4th Sat)',
    description: 'Statutory banking & plant pattern: 1st, 3rd & 5th Saturdays working, 2nd & 4th off.',
    applicableDays: ['Sunday', '2nd Saturday', '4th Saturday'],
    saturdayRule: '2nd & 4th Saturday Off',
    sundayRule: 'All Sundays Off',
    assignedCount: 36,
    isDefault: false,
    status: 'Active',
  },
  {
    id: 'wo-3',
    name: '6-Day Production Pattern (Sunday Only Off)',
    description: 'Operations and facility staff schedule with mandatory weekly rest on Sunday.',
    applicableDays: ['Sunday'],
    saturdayRule: 'All Saturdays Working',
    sundayRule: 'All Sundays Off',
    assignedCount: 12,
    isDefault: false,
    status: 'Active',
  },
];

export const INITIAL_ROSTER_EMPLOYEES: RosterEmployeeRow[] = [
  {
    id: 'emp-drfl032',
    empCode: 'DRFL032',
    name: 'Noushad Mansurii',
    department: 'Technology',
    designation: 'Senior Executive',
    location: 'Hyderabad',
    email: 'noushad.m@2coms.com',
    contact: '+91 98765 43210',
    aadhaar: 'XXXX-XXXX-4589',
    workMode: 'wfh',
    currentShift: 'Morning Shift',
    weekoffPattern: 'WO: Alternate Holiday',
    shiftsByDay: {
      '01': '-', '02': '-', '03': '-', '04': '-', '05': '-', '06': '-', '07': '-',
      '08': '-', '09': '-', '10': '-', '11': '-', '12': '-', '13': '-', '14': '-',
      '15': 'MS', '16': 'MS', '17': 'MS', '18': 'MS', '19': 'MS', '20': 'WO',
      '21': 'MS', '22': 'MS', '23': 'MS', '24': 'MS', '25': 'MS', '26': 'MS',
      '27': 'WO', '28': 'MS', '29': 'MS', '30': 'MS',
    },
  },
  {
    id: 'emp-drfl033',
    empCode: 'DRFL033',
    name: 'Rentala Narender',
    department: 'Technology',
    designation: 'Web Application Tester',
    location: 'Hyderabad',
    email: 'rentala.n@2coms.com',
    contact: '+91 98123 45678',
    aadhaar: 'XXXX-XXXX-9912',
    workMode: 'wfh',
    currentShift: 'Morning Shift',
    weekoffPattern: 'WO: Alternate Holiday',
    shiftsByDay: {
      '01': 'MS', '02': 'MS', '03': 'MS', '04': 'MS', '05': 'MS', '06': 'WO',
      '07': 'MS', '08': 'MS', '09': 'MS', '10': 'MS', '11': 'MS', '12': 'MS',
      '13': 'WO', '14': 'MS', '15': 'MS', '16': 'MS', '17': 'MS', '18': 'MS',
      '19': 'MS', '20': 'WO', '21': 'MS', '22': 'MS', '23': 'MS', '24': 'MS',
      '25': 'MS', '26': 'MS', '27': 'WO', '28': 'MS', '29': 'MS', '30': 'MS',
    },
  },
  {
    id: 'emp-drfl029',
    empCode: 'DRFL029',
    name: 'Anik Bandopadhyay',
    department: 'Technology',
    designation: 'Senior Developer',
    location: 'Hyderabad',
    email: 'anik.b@2coms.com',
    contact: '+91 97481 22334',
    aadhaar: 'XXXX-XXXX-1102',
    workMode: 'wfh',
    currentShift: 'Not Assigned',
    weekoffPattern: 'Not Assigned',
    shiftsByDay: {
      '01': '-', '02': '-', '03': '-', '04': '-', '05': '-', '06': '-', '07': '-',
      '08': '-', '09': '-', '10': '-', '11': '-', '12': '-', '13': '-', '14': '-',
      '15': '-', '16': '-', '17': '-', '18': '-', '19': '-', '20': '-', '21': '-',
      '22': '-', '23': '-', '24': '-', '25': '-', '26': '-', '27': '-', '28': '-',
      '29': '-', '30': '-',
    },
  },
  {
    id: 'emp-drfl030',
    empCode: 'DRFL030',
    name: 'Bobby Daze',
    department: 'Technology',
    designation: 'QA Lead',
    location: 'Kolkata',
    email: 'bobby.d@2coms.com',
    contact: '+91 98300 12345',
    aadhaar: 'XXXX-XXXX-3341',
    workMode: 'office',
    currentShift: 'Not Assigned',
    weekoffPattern: 'Not Assigned',
    shiftsByDay: {
      '01': '-', '02': '-', '03': '-', '04': '-', '05': '-', '06': '-', '07': '-',
      '08': '-', '09': '-', '10': '-', '11': '-', '12': '-', '13': '-', '14': '-',
      '15': '-', '16': '-', '17': '-', '18': '-', '19': '-', '20': '-', '21': '-',
      '22': '-', '23': '-', '24': '-', '25': '-', '26': '-', '27': '-', '28': '-',
      '29': '-', '30': '-',
    },
  },
  {
    id: 'emp-drfl037',
    empCode: 'DRFL037',
    name: 'Amit Roy',
    department: 'Operations',
    designation: 'Operations Manager',
    location: 'Kolkata',
    email: 'amit.roy@2coms.com',
    contact: '+91 98451 99882',
    aadhaar: 'XXXX-XXXX-6619',
    workMode: 'office',
    currentShift: 'Not Assigned',
    weekoffPattern: 'Not Assigned',
    shiftsByDay: {
      '01': '-', '02': '-', '03': '-', '04': '-', '05': '-', '06': '-', '07': '-',
      '08': '-', '09': '-', '10': '-', '11': '-', '12': '-', '13': '-', '14': '-',
      '15': '-', '16': '-', '17': '-', '18': '-', '19': '-', '20': '-', '21': '-',
      '22': '-', '23': '-', '24': '-', '25': '-', '26': '-', '27': '-', '28': '-',
      '29': '-', '30': '-',
    },
  },
  {
    id: 'emp-drfl038',
    empCode: 'DRFL038',
    name: 'D Patra',
    department: 'Human Resources',
    designation: 'HR Executive',
    location: 'Kolkata',
    email: 'd.patra@2coms.com',
    contact: '+91 98311 55667',
    aadhaar: 'XXXX-XXXX-8822',
    workMode: 'office',
    currentShift: 'Not Assigned',
    weekoffPattern: 'Not Assigned',
    shiftsByDay: {
      '01': '-', '02': '-', '03': '-', '04': '-', '05': '-', '06': '-', '07': '-',
      '08': '-', '09': '-', '10': '-', '11': '-', '12': '-', '13': '-', '14': '-',
      '15': '-', '16': '-', '17': '-', '18': '-', '19': '-', '20': '-', '21': '-',
      '22': '-', '23': '-', '24': '-', '25': '-', '26': '-', '27': '-', '28': '-',
      '29': '-', '30': '-',
    },
  },
  {
    id: 'emp-drfl039',
    empCode: 'DRFL039',
    name: 'Sneha Sharma',
    department: 'Product',
    designation: 'Business Analyst',
    location: 'Bangalore',
    email: 'sneha.sharma@2coms.com',
    contact: '+91 99001 22334',
    aadhaar: 'XXXX-XXXX-7744',
    workMode: 'hybrid',
    currentShift: 'Not Assigned',
    weekoffPattern: 'Not Assigned',
    shiftsByDay: {
      '01': '-', '02': '-', '03': '-', '04': '-', '05': '-', '06': '-', '07': '-',
      '08': '-', '09': '-', '10': '-', '11': '-', '12': '-', '13': '-', '14': '-',
      '15': '-', '16': '-', '17': '-', '18': '-', '19': '-', '20': '-', '21': '-',
      '22': '-', '23': '-', '24': '-', '25': '-', '26': '-', '27': '-', '28': '-',
      '29': '-', '30': '-',
    },
  },
  {
    id: 'emp-drfl041',
    empCode: 'DRFL041',
    name: 'Rahul Verma',
    department: 'Technology',
    designation: 'Frontend Engineer',
    location: 'Hyderabad',
    email: 'rahul.verma@2coms.com',
    contact: '+91 97123 99881',
    aadhaar: 'XXXX-XXXX-9933',
    workMode: 'wfh',
    currentShift: 'Not Assigned',
    weekoffPattern: 'Not Assigned',
    shiftsByDay: {
      '01': '-', '02': '-', '03': '-', '04': '-', '05': '-', '06': '-', '07': '-',
      '08': '-', '09': '-', '10': '-', '11': '-', '12': '-', '13': '-', '14': '-',
      '15': '-', '16': '-', '17': '-', '18': '-', '19': '-', '20': '-', '21': '-',
      '22': '-', '23': '-', '24': '-', '25': '-', '26': '-', '27': '-', '28': '-',
      '29': '-', '30': '-',
    },
  },
  {
    id: 'emp-drfl040',
    empCode: 'DRFL040',
    name: 'Priya Nair',
    department: 'Finance',
    designation: 'Finance Associate',
    location: 'Mumbai',
    email: 'priya.nair@2coms.com',
    contact: '+91 98220 44556',
    aadhaar: 'XXXX-XXXX-5521',
    workMode: 'office',
    currentShift: 'Not Assigned',
    weekoffPattern: 'Not Assigned',
    shiftsByDay: {
      '01': '-', '02': '-', '03': '-', '04': '-', '05': '-', '06': '-', '07': '-',
      '08': '-', '09': '-', '10': '-', '11': '-', '12': '-', '13': '-', '14': '-',
      '15': '-', '16': '-', '17': '-', '18': '-', '19': '-', '20': '-', '21': '-',
      '22': '-', '23': '-', '24': '-', '25': '-', '26': '-', '27': '-', '28': '-',
      '29': '-', '30': '-',
    },
  },
];

export const INITIAL_DAILY_MUSTER_LOG: DailyMusterLogEntry[] = [
  {
    id: 'dm-1',
    empCode: '2C-8941',
    name: 'Priya Sharma',
    department: 'Engineering',
    location: 'Kolkata - RDB Office',
    workZone: 'Kolkata',
    mappedLocation: 'Kolkata / RDB',
    mappedOffice: 'RDB',
    punchedLocation: 'Big Bagan',
    punchedOffice: 'Big Bagan',
    validationResult: 'Accepted: Permitted Kolkata Office',
    validationReason: 'Big Bagan is a permitted Kolkata office location.',
    date: '2026-08-25',
    shiftCode: 'GS',
    shiftTiming: '09:00 AM - 06:00 PM',
    inTime: '09:02 AM',
    outTime: '06:14 PM',
    totalHours: '09h 12m',
    lateMins: '0m',
    earlyExitMins: '0m',
    punchSource: 'Mobile Geo-punch (Big Bagan Hub)',
    status: 'Present',
    deviceInfo: 'GeoFence-KOL-BBG (In-Range)',
    regularizationStatus: 'None',
    isMyTeam: true,
  },
  {
    id: 'dm-2',
    empCode: '2C-8942',
    name: 'Rahul Verma',
    department: 'Operations',
    location: 'Kolkata - RDB Office',
    workZone: 'Kolkata',
    mappedLocation: 'Kolkata / RDB',
    mappedOffice: 'RDB',
    punchedLocation: 'RDB',
    punchedOffice: 'RDB',
    validationResult: 'Accepted: Same Office',
    validationReason: 'Punched from designated base office.',
    date: '2026-08-25',
    shiftCode: 'MS',
    shiftTiming: '07:00 AM - 03:30 PM',
    inTime: '07:28 AM',
    outTime: '03:45 PM',
    totalHours: '08h 17m',
    lateMins: '28m',
    earlyExitMins: '0m',
    punchSource: 'Biometric Face ID (RDB Gate 1)',
    status: 'Present',
    deviceInfo: 'BioSec-KOL-RDB-01',
    regularizationStatus: 'None',
    isMyTeam: true,
  },
  {
    id: 'dm-3',
    empCode: '2C-8943',
    name: 'Ananya Sengupta',
    department: 'HR Services',
    location: 'Kolkata - Alipore Office',
    workZone: 'Kolkata',
    mappedLocation: 'Kolkata / Alipore',
    mappedOffice: 'Alipore',
    punchedLocation: 'RDB',
    punchedOffice: 'RDB',
    validationResult: 'Accepted: Permitted Kolkata Office',
    validationReason: 'RDB is a permitted Kolkata office location.',
    date: '2026-08-25',
    shiftCode: 'GS',
    shiftTiming: '09:00 AM - 06:00 PM',
    inTime: '08:52 AM',
    outTime: '06:08 PM',
    totalHours: '09h 16m',
    lateMins: '0m',
    earlyExitMins: '0m',
    punchSource: 'Biometric Face ID (RDB Gate 2)',
    status: 'Present',
    deviceInfo: 'BioSec-KOL-RDB-02',
    regularizationStatus: 'None',
    isMyTeam: false,
  },
  {
    id: 'dm-4',
    empCode: '2C-8944',
    name: 'Vikram Malhotra',
    department: 'Engineering',
    location: 'Kolkata - Big Bagan Office',
    workZone: 'Kolkata',
    mappedLocation: 'Kolkata / Big Bagan',
    mappedOffice: 'Big Bagan',
    punchedLocation: 'Alipore',
    punchedOffice: 'Alipore',
    validationResult: 'Accepted: Permitted Kolkata Office',
    validationReason: 'Alipore is a permitted Kolkata office location.',
    date: '2026-08-25',
    shiftCode: 'GS',
    shiftTiming: '09:00 AM - 06:00 PM',
    inTime: '09:05 AM',
    outTime: '06:10 PM',
    totalHours: '09h 05m',
    lateMins: '5m',
    earlyExitMins: '0m',
    punchSource: 'Mobile Geo-punch (Alipore Hub)',
    status: 'Present',
    deviceInfo: 'GeoFence-KOL-ALP (In-Range)',
    regularizationStatus: 'None',
    isMyTeam: true,
  },
  {
    id: 'dm-5',
    empCode: '2C-8945',
    name: 'Debanjan Mukherjee',
    department: 'Finance',
    location: 'Kolkata - RDB Office',
    workZone: 'Kolkata',
    mappedLocation: 'Kolkata / RDB',
    mappedOffice: 'RDB',
    punchedLocation: 'Howrah Station [Outside Geo-fence]',
    punchedOffice: 'Outside Permitted Location',
    validationResult: 'Rejected: Outside Permitted Location',
    validationReason: 'Punch attempted from Howrah Station outside authorized Kolkata offices (only RDB, Big Bagan, and Alipore are permitted).',
    date: '2026-08-25',
    shiftCode: 'GS',
    shiftTiming: '09:00 AM - 06:00 PM',
    inTime: '09:40 AM (Flagged)',
    outTime: '—',
    totalHours: '00h 00m',
    lateMins: '—',
    earlyExitMins: '—',
    punchSource: 'GPS Disallowed (Howrah)',
    status: 'Absent',
    deviceInfo: 'Android 15 (Geo-boundary Violation)',
    regularizationStatus: 'Pending',
    isMyTeam: false,
  },
  {
    id: 'dm-6',
    empCode: '2C-8946',
    name: 'Sourav Das',
    department: 'Operations',
    location: 'Kolkata - Alipore Office',
    workZone: 'Kolkata',
    mappedLocation: 'Kolkata / Alipore',
    mappedOffice: 'Alipore',
    punchedLocation: 'Alipore',
    punchedOffice: 'Alipore',
    validationResult: 'Accepted: Same Office',
    validationReason: 'Punched from designated base office.',
    date: '2026-08-25',
    shiftCode: 'GS',
    shiftTiming: '09:00 AM - 06:00 PM',
    inTime: '08:58 AM',
    outTime: '06:12 PM',
    totalHours: '09h 14m',
    lateMins: '0m',
    earlyExitMins: '0m',
    punchSource: 'Biometric Face ID (Alipore Gate 1)',
    status: 'Present',
    deviceInfo: 'BioSec-KOL-ALP-01',
    regularizationStatus: 'None',
    isMyTeam: false,
  },
  {
    id: 'dm-7',
    empCode: '2C-8947',
    name: 'Arjun Dasgupta',
    department: 'Operations',
    location: 'Kolkata - RDB Office',
    workZone: 'Kolkata',
    mappedLocation: 'Kolkata / RDB',
    mappedOffice: 'RDB',
    punchedLocation: 'Big Bagan',
    punchedOffice: 'Big Bagan',
    validationResult: 'Accepted: Permitted Kolkata Office',
    validationReason: 'Big Bagan is a permitted Kolkata office location.',
    date: '2026-08-25',
    shiftCode: 'GS',
    shiftTiming: '09:00 AM - 06:00 PM',
    inTime: '08:50 AM',
    outTime: '06:05 PM',
    totalHours: '09h 15m',
    lateMins: '0m',
    earlyExitMins: '0m',
    punchSource: 'Mobile Geo-punch (Big Bagan Hub)',
    status: 'Present',
    deviceInfo: 'GeoFence-KOL-BBG (In-Range)',
    regularizationStatus: 'None',
    isMyTeam: true,
  },
  {
    id: 'dm-8',
    empCode: '2C-8948',
    name: 'Sneha Reddy',
    department: 'Engineering',
    location: 'Hyderabad - City Default',
    workZone: 'Hyderabad',
    mappedLocation: 'Hyderabad City',
    mappedOffice: 'City-wide Office',
    punchedLocation: 'Hyderabad City',
    punchedOffice: 'City-wide Office',
    validationResult: 'Accepted: Same Office',
    validationReason: 'City-level authorized punch.',
    date: '2026-08-25',
    shiftCode: 'GS',
    shiftTiming: '09:00 AM - 06:00 PM',
    inTime: '09:04 AM',
    outTime: '06:18 PM',
    totalHours: '09h 14m',
    lateMins: '4m',
    earlyExitMins: '0m',
    punchSource: 'Biometric Face ID',
    status: 'Present',
    deviceInfo: 'BioSec-HYD-01',
    regularizationStatus: 'None',
    isMyTeam: false,
  },
];

export const INITIAL_GEO_FENCES: GeoFenceLocation[] = [
  {
    id: 'geo-1',
    name: 'Hyderabad Home Branch / Tech Campus',
    address: 'Plot 42, Hitec City Phase 2, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4485,
    longitude: 78.3756,
    radiusMeters: 150,
    enforcementMode: 'Strict (Block Outside)',
    allowedWifiSSID: '2COMS-Corp-5G',
    allowedIPSubnet: '10.24.100.0/24',
    enrolledStaff: 142,
    status: 'Active',
    lastActivity: 'Active · 114 punches recorded today',
  },
  {
    id: 'geo-2',
    name: 'Bangalore SEZ Deputation Site',
    address: 'Tower C, Ecospace Business Park, Bellandur',
    city: 'Bangalore',
    state: 'Karnataka',
    latitude: 12.9260,
    longitude: 77.6830,
    radiusMeters: 250,
    enforcementMode: 'Warning (Allow with Flag)',
    allowedWifiSSID: 'TCS-Guest-Secure',
    allowedIPSubnet: '172.16.20.0/24',
    enrolledStaff: 48,
    status: 'Active',
    lastActivity: 'Active · 42 punches recorded today',
  },
  {
    id: 'geo-3',
    name: 'Kolkata Regional Training Hub',
    address: 'Sector V, Salt Lake, Bidhannagar',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5801,
    longitude: 88.4284,
    radiusMeters: 300,
    enforcementMode: 'Audit Log Only',
    allowedWifiSSID: '2COMS-Kolkata-WLAN',
    allowedIPSubnet: '192.168.1.0/24',
    enrolledStaff: 28,
    status: 'Active',
    lastActivity: 'Active · 21 punches recorded today',
  },
];

export const INITIAL_HOLIDAYS_2026: HolidayItem[] = [
  {
    id: 'hol-1',
    name: 'Republic Day',
    date: '2026-01-26',
    dayOfWeek: 'Monday',
    type: 'Mandatory National',
    applicableBranch: 'All Locations (National)',
    isPaid: true,
    year: 2026,
  },
  {
    id: 'hol-2',
    name: 'Holi',
    date: '2026-03-04',
    dayOfWeek: 'Wednesday',
    type: 'Mandatory National',
    applicableBranch: 'All Locations',
    isPaid: true,
    year: 2026,
  },
  {
    id: 'hol-3',
    name: 'Telangana Formation Day',
    date: '2026-06-02',
    dayOfWeek: 'Tuesday',
    type: 'State Specific',
    applicableBranch: 'Hyderabad (Home Branch) Only',
    isPaid: true,
    year: 2026,
  },
  {
    id: 'hol-4',
    name: 'Independence Day',
    date: '2026-08-15',
    dayOfWeek: 'Saturday',
    type: 'Mandatory National',
    applicableBranch: 'All Locations (National)',
    isPaid: true,
    year: 2026,
  },
  {
    id: 'hol-5',
    name: 'Janmashtami',
    date: '2026-08-25',
    dayOfWeek: 'Tuesday',
    type: 'Mandatory National',
    applicableBranch: 'Hyderabad & Bangalore',
    isPaid: true,
    year: 2026,
  },
  {
    id: 'hol-6',
    name: 'Mahatma Gandhi Jayanti',
    date: '2026-10-02',
    dayOfWeek: 'Friday',
    type: 'Mandatory National',
    applicableBranch: 'All Locations (National)',
    isPaid: true,
    year: 2026,
  },
  {
    id: 'hol-7',
    name: 'Dussehra (Vijayadashami)',
    date: '2026-10-20',
    dayOfWeek: 'Tuesday',
    type: 'Mandatory National',
    applicableBranch: 'All Locations',
    isPaid: true,
    year: 2026,
  },
  {
    id: 'hol-8',
    name: 'Diwali (Deepavali)',
    date: '2026-11-08',
    dayOfWeek: 'Sunday',
    type: 'Mandatory National',
    applicableBranch: 'All Locations',
    isPaid: true,
    year: 2026,
  },
  {
    id: 'hol-9',
    name: 'Christmas',
    date: '2026-12-25',
    dayOfWeek: 'Friday',
    type: 'Mandatory National',
    applicableBranch: 'All Locations',
    isPaid: true,
    year: 2026,
  },
];

export const INITIAL_OVERTIME_CONFIG: OvertimeConfigSettings = {
  minQualifyingMinutes: 60,
  rateMultiplierWeekday: 1.5,
  rateMultiplierWeekend: 2.0,
  rateMultiplierHoliday: 2.0,
  dailyMaxOtHours: 4,
  monthlyMaxOtHours: 48,
  requirePreApproval: true,
  allowCompOffConversion: true,
  autoRoundOffMinutes: 15,
};

export const INITIAL_OVERTIME_RECORDS: OvertimeLogRecord[] = [
  {
    id: 'ot-1',
    empCode: '2C-8941',
    name: 'Priya Sharma',
    department: 'Engineering',
    date: '2026-08-21',
    shiftTiming: '09:00 AM - 06:00 PM',
    shiftHours: '08h 00m',
    actualPunchHours: '10h 45m',
    otDuration: '02h 45m',
    rateType: 'Weekday 1.5x',
    calculatedPayout: 1850,
    status: 'Approved',
    approver: 'Sunil Mehta (Delivery Head)',
  },
  {
    id: 'ot-2',
    empCode: '2C-8944',
    name: 'Vikram Malhotra',
    department: 'Engineering',
    date: '2026-08-22',
    shiftTiming: '09:00 AM - 06:00 PM (Saturday Work)',
    shiftHours: '08h 00m',
    actualPunchHours: '11h 15m',
    otDuration: '03h 15m',
    rateType: 'Weekend 2.0x',
    calculatedPayout: 2750,
    status: 'Pending Supervisor Approval',
    approver: 'Sunil Mehta (Delivery Head)',
  },
  {
    id: 'ot-3',
    empCode: '2C-8942',
    name: 'Rahul Verma',
    department: 'Operations',
    date: '2026-08-25',
    shiftTiming: '07:00 AM - 03:30 PM (Janmashtami)',
    shiftHours: '07h 45m',
    actualPunchHours: '10h 30m',
    otDuration: '02h 45m',
    rateType: 'Holiday 2.0x',
    calculatedPayout: 2200,
    status: 'Converted to Comp-Off',
    approver: 'Rashmi Sen (Ops Lead)',
  },
  {
    id: 'ot-4',
    empCode: '2C-8946',
    name: 'Arjun Dasgupta',
    department: 'Operations',
    date: '2026-08-19',
    shiftTiming: '09:00 AM - 06:00 PM',
    shiftHours: '08h 00m',
    actualPunchHours: '10h 10m',
    otDuration: '02h 10m',
    rateType: 'Weekday 1.5x',
    calculatedPayout: 1420,
    status: 'Approved',
    approver: 'Rashmi Sen (Ops Lead)',
  },
];

export const INITIAL_EMPLOYEE_ATTENDANCE: EmployeeAttendanceSummary[] = [
  {
    id: 'emp-1',
    empCode: '2C-8941',
    name: 'Priya Sharma',
    department: 'Engineering',
    present: 22,
    absent: 0,
    leave: 1,
    lateDays: 0,
    attendancePct: 95.6,
    isMyTeam: true,
    dailyRecords: [
      { id: 'd-1', date: '01 Aug 2026', day: 'Fri', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '09:02 AM', outTime: '06:14 PM', totalHours: '09h 12m', lateMins: '0m' },
      { id: 'd-2', date: '02 Aug 2026', day: 'Sat', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-3', date: '03 Aug 2026', day: 'Sun', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-4', date: '04 Aug 2026', day: 'Mon', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '09:18 AM', outTime: '06:22 PM', totalHours: '09h 04m', lateMins: '18m' },
      { id: 'd-5', date: '05 Aug 2026', day: 'Tue', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '08:55 AM', outTime: '06:05 PM', totalHours: '09h 10m', lateMins: '0m' },
      { id: 'd-6', date: '06 Aug 2026', day: 'Wed', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '09:05 AM', outTime: '06:30 PM', totalHours: '09h 25m', lateMins: '5m' },
      { id: 'd-7', date: '07 Aug 2026', day: 'Thu', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '08:58 AM', outTime: '06:10 PM', totalHours: '09h 12m', lateMins: '0m' },
      { id: 'd-8', date: '08 Aug 2026', day: 'Fri', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '09:01 AM', outTime: '06:02 PM', totalHours: '09h 01m', lateMins: '1m' },
      { id: 'd-9', date: '15 Aug 2026', day: 'Sat', location: 'Independence Day', status: 'Holiday', holidayName: 'Independence Day', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-10', date: '25 Aug 2026', day: 'Tue', location: 'Janmashtami', status: 'Holiday', holidayName: 'Janmashtami', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-11', date: '28 Aug 2026', day: 'Fri', location: 'Leave (Casual)', status: 'Not Marked', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
    ],
  },
  {
    id: 'emp-2',
    empCode: '2C-8942',
    name: 'Rahul Verma',
    department: 'Operations',
    present: 19,
    absent: 2,
    leave: 2,
    lateDays: 3,
    attendancePct: 82.6,
    isMyTeam: true,
    dailyRecords: [
      { id: 'd-201', date: '01 Aug 2026', day: 'Fri', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '09:35 AM', outTime: '06:40 PM', totalHours: '09h 05m', lateMins: '35m' },
      { id: 'd-202', date: '02 Aug 2026', day: 'Sat', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-203', date: '03 Aug 2026', day: 'Sun', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-204', date: '04 Aug 2026', day: 'Mon', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '09:20 AM', outTime: '06:15 PM', totalHours: '08h 55m', lateMins: '20m' },
      { id: 'd-205', date: '05 Aug 2026', day: 'Tue', location: '— (Unplanned)', status: 'Absent', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-206', date: '15 Aug 2026', day: 'Sat', location: 'Independence Day', status: 'Holiday', holidayName: 'Independence Day', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-207', date: '25 Aug 2026', day: 'Tue', location: 'Janmashtami', status: 'Holiday', holidayName: 'Janmashtami', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
    ],
  },
  {
    id: 'emp-3',
    empCode: '2C-8943',
    name: 'Ananya Sengupta',
    department: 'HR Services',
    present: 23,
    absent: 0,
    leave: 0,
    lateDays: 1,
    attendancePct: 100.0,
    isMyTeam: false,
    dailyRecords: [
      { id: 'd-301', date: '01 Aug 2026', day: 'Fri', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '08:50 AM', outTime: '06:05 PM', totalHours: '09h 15m', lateMins: '0m' },
      { id: 'd-302', date: '02 Aug 2026', day: 'Sat', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-303', date: '03 Aug 2026', day: 'Sun', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-304', date: '15 Aug 2026', day: 'Sat', location: 'Independence Day', status: 'Holiday', holidayName: 'Independence Day', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-305', date: '25 Aug 2026', day: 'Tue', location: 'Janmashtami', status: 'Holiday', holidayName: 'Janmashtami', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
    ],
  },
  {
    id: 'emp-4',
    empCode: '2C-8944',
    name: 'Vikram Malhotra',
    department: 'Engineering',
    present: 18,
    absent: 3,
    leave: 2,
    lateDays: 4,
    attendancePct: 78.2,
    isMyTeam: true,
    dailyRecords: [
      { id: 'd-401', date: '01 Aug 2026', day: 'Fri', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '09:40 AM', outTime: '06:45 PM', totalHours: '09h 05m', lateMins: '40m' },
      { id: 'd-402', date: '02 Aug 2026', day: 'Sat', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-403', date: '03 Aug 2026', day: 'Sun', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-404', date: '04 Aug 2026', day: 'Mon', location: '—', status: 'Absent', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-405', date: '15 Aug 2026', day: 'Sat', location: 'Independence Day', status: 'Holiday', holidayName: 'Independence Day', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-406', date: '25 Aug 2026', day: 'Tue', location: 'Janmashtami', status: 'Holiday', holidayName: 'Janmashtami', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
    ],
  },
  {
    id: 'emp-5',
    empCode: '2C-8945',
    name: 'Kavita Nair',
    department: 'Finance',
    present: 21,
    absent: 1,
    leave: 1,
    lateDays: 1,
    attendancePct: 91.3,
    isMyTeam: false,
    dailyRecords: [
      { id: 'd-501', date: '01 Aug 2026', day: 'Fri', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '08:58 AM', outTime: '06:12 PM', totalHours: '09h 14m', lateMins: '0m' },
      { id: 'd-502', date: '02 Aug 2026', day: 'Sat', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-503', date: '15 Aug 2026', day: 'Sat', location: 'Independence Day', status: 'Holiday', holidayName: 'Independence Day', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-504', date: '25 Aug 2026', day: 'Tue', location: 'Janmashtami', status: 'Holiday', holidayName: 'Janmashtami', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
    ],
  },
  {
    id: 'emp-6',
    empCode: '2C-8946',
    name: 'Arjun Dasgupta',
    department: 'Operations',
    present: 22,
    absent: 0,
    leave: 1,
    lateDays: 2,
    attendancePct: 95.6,
    isMyTeam: false,
    dailyRecords: [
      { id: 'd-601', date: '01 Aug 2026', day: 'Fri', location: 'Hyderabad - Home Branch', status: 'Present', inTime: '09:12 AM', outTime: '06:18 PM', totalHours: '09h 06m', lateMins: '12m' },
      { id: 'd-602', date: '02 Aug 2026', day: 'Sat', location: '— (Weekly Off)', status: 'Weekend', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-603', date: '15 Aug 2026', day: 'Sat', location: 'Independence Day', status: 'Holiday', holidayName: 'Independence Day', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
      { id: 'd-604', date: '25 Aug 2026', day: 'Tue', location: 'Janmashtami', status: 'Holiday', holidayName: 'Janmashtami', inTime: '—', outTime: '—', totalHours: '—', lateMins: '—' },
    ],
  },
];
