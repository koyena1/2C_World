/**
 * Mock data for Attendance -> Regularization (E-Sampark integration) and Attendance -> Notifications.
 * Frontend simulation only. "Today" is fixed at 2026-10-05 so every number is stable.
 */

export type RegularizationStatus = 'Pending' | 'Approved' | 'Rejected';
export type PunchIssueType = 'Missed punch' | 'Late' | 'Half day' | 'On duty';

export const PUNCH_ISSUE_TYPES: PunchIssueType[] = ['Missed punch', 'Late', 'Half day', 'On duty'];
export const REGULARIZATION_CLIENTS = [
  'Tata Consultancy Services',
  'Infosys Technologies',
  'HDFC Bank Ltd',
  'Flipkart Internet Pvt Ltd',
  'Larsen & Toubro Ltd',
  'Wipro Digital',
  'Reliance Retail Ltd',
];

/** SLA target (hours) from raise to decision. */
export const REGULARIZATION_SLA_HOURS = 24;

export interface RegularizationRequest {
  id: string;
  employee: string;
  empCode: string;
  client: string;
  /** Attendance date being regularized (yyyy-mm-dd). */
  date: string;
  issueType: PunchIssueType;
  requestedIn: string;
  requestedOut: string;
  reason: string;
  status: RegularizationStatus;
  /** Hours since the request was raised on E-Sampark (for decided requests: hours it took to decide). */
  ageHours: number;
  /** Raised in the last 24 hours (counts towards "requests today"). */
  raisedToday: boolean;
  source: 'E-Sampark' | 'Manual';
  decidedBy?: string;
  rejectReason?: string;
}

const NAMES = [
  'Rohan Mehta', 'Priya Nair', 'Arjun Reddy', 'Sneha Kulkarni', 'Vikram Singh', 'Ananya Iyer', 'Karthik Subramanian',
  'Neha Gupta', 'Rahul Verma', 'Pooja Sharma', 'Aditya Joshi', 'Divya Menon', 'Sanjay Patil', 'Meera Krishnan',
  'Amit Chatterjee', 'Kavya Rao', 'Manish Agarwal', 'Ritu Banerjee', 'Suresh Kumar', 'Lakshmi Narayanan',
  'Deepak Yadav', 'Shruti Desai', 'Nikhil Bhatt', 'Swati Mishra', 'Harish Pillai', 'Tanvi Kapoor',
];

const REASONS: Record<PunchIssueType, string[]> = {
  'Missed punch': ['Biometric device offline at gate', 'Forgot to punch out, left on client call', 'App crashed during punch-in', 'Network issue at the site'],
  Late: ['Metro services delayed on the Blue Line', 'Heavy rain and waterlogging on the route', 'Vehicle breakdown on the way'],
  'Half day': ['Medical appointment in the afternoon', 'Family emergency, left early with manager approval', 'Bank work, informed supervisor'],
  'On duty': ['Client site visit, no biometric at location', 'Training at the client office', 'Vendor audit at the warehouse'],
};

const IN_OUT: Record<PunchIssueType, [string, string]> = {
  'Missed punch': ['09:30', '18:30'],
  Late: ['10:25', '18:30'],
  'Half day': ['09:30', '13:30'],
  'On duty': ['09:00', '18:00'],
};

const buildRequests = (): RegularizationRequest[] => {
  const rows: RegularizationRequest[] = [];
  for (let i = 0; i < 54; i += 1) {
    const issueType = PUNCH_ISSUE_TYPES[(i * 3 + 1) % 4];
    const reasons = REASONS[issueType];
    const [reqIn, reqOut] = IN_OUT[issueType];
    // ~ 55% pending, 30% approved, 15% rejected
    const bucket = i % 20;
    const status: RegularizationStatus = bucket < 11 ? 'Pending' : bucket < 17 ? 'Approved' : 'Rejected';
    const ageHours = status === 'Pending' ? 2 + ((i * 7) % 44) : 3 + ((i * 5) % 26);
    const dayOffset = ageHours > 24 ? 2 : 1;
    const d = 5 - dayOffset;
    rows.push({
      id: `REG-${2400 + i}`,
      employee: NAMES[(i * 5) % NAMES.length],
      empCode: `2C${String(1040 + ((i * 17) % 400)).padStart(5, '0')}`,
      client: REGULARIZATION_CLIENTS[i % REGULARIZATION_CLIENTS.length],
      date: `2026-10-${String(d).padStart(2, '0')}`,
      issueType,
      requestedIn: reqIn,
      requestedOut: reqOut,
      reason: reasons[i % reasons.length],
      status,
      ageHours,
      raisedToday: ageHours <= 24,
      source: i % 9 === 0 ? 'Manual' : 'E-Sampark',
      decidedBy: status === 'Pending' ? undefined : i % 2 === 0 ? 'Ananya (Ops Lead)' : 'Vikram (Client HR)',
      rejectReason: status === 'Rejected' ? 'No supporting evidence from the client supervisor' : undefined,
    });
  }
  return rows;
};

export const INITIAL_REGULARIZATION_REQUESTS: RegularizationRequest[] = buildRequests();

/** Pending requests in the initial mock state (used for badges elsewhere). */
export const pendingRegularizationCount = (): number =>
  INITIAL_REGULARIZATION_REQUESTS.filter((r) => r.status === 'Pending').length;

/** Mock requests that a "Sync with E-Sampark" pull brings in. */
export const buildSyncedRequests = (startIndex: number): RegularizationRequest[] => {
  const batch: Array<[string, string, string, PunchIssueType, string]> = [
    ['Tejas Kulkarni', '2C01712', 'Wipro Digital', 'Missed punch', 'Biometric device offline at gate'],
    ['Farah Sheikh', '2C01388', 'HDFC Bank Ltd', 'Late', 'Heavy rain and waterlogging on the route'],
    ['Gaurav Malhotra', '2C01544', 'Tata Consultancy Services', 'On duty', 'Client site visit, no biometric at location'],
    ['Ishita Bose', '2C01229', 'Reliance Retail Ltd', 'Half day', 'Medical appointment in the afternoon'],
    ['Pranav Hegde', '2C01630', 'Infosys Technologies', 'Missed punch', 'App crashed during punch-in'],
    ['Leena Thomas', '2C01097', 'Flipkart Internet Pvt Ltd', 'Late', 'Vehicle breakdown on the way'],
  ];
  return batch.map(([employee, empCode, client, issueType, reason], i) => ({
    id: `REG-${2600 + startIndex + i}`,
    employee,
    empCode,
    client,
    date: '2026-10-05',
    issueType,
    requestedIn: IN_OUT[issueType][0],
    requestedOut: IN_OUT[issueType][1],
    reason,
    status: 'Pending' as const,
    ageHours: 1,
    raisedToday: true,
    source: 'E-Sampark' as const,
  }));
};

/* -------------------------- Integration feasibility -------------------------- */

export type FeasibilityStatus = 'Confirmed' | 'Pending client' | 'Blocked';
export type FeasibilityGroup = 'Dependency' | 'Client permission' | 'Technical limitation';

export interface FeasibilityItem {
  id: string;
  group: FeasibilityGroup;
  item: string;
  status: FeasibilityStatus;
  owner: string;
}

export const FEASIBILITY_ITEMS: FeasibilityItem[] = [
  { id: 'F1', group: 'Dependency', item: 'E-Sampark production environment access (UAT credentials issued)', status: 'Confirmed', owner: '2COMS Tech' },
  { id: 'F2', group: 'Dependency', item: 'Attendance request data model and field mapping document', status: 'Confirmed', owner: '2COMS Tech' },
  { id: 'F3', group: 'Dependency', item: 'Employee code mapping between E-Sampark and 2COMS payroll IDs', status: 'Pending client', owner: 'Client HR' },
  { id: 'F4', group: 'Client permission', item: 'Written approval to read regularization requests via API', status: 'Pending client', owner: 'Client IT' },
  { id: 'F5', group: 'Client permission', item: 'Write-back permission to update request status on E-Sampark', status: 'Pending client', owner: 'Client IT' },
  { id: 'F6', group: 'Client permission', item: 'Service account with scoped, read/approve-only role', status: 'Confirmed', owner: 'Client IT' },
  { id: 'F7', group: 'Technical limitation', item: 'No public REST API: portal exposes scheduled CSV export only', status: 'Blocked', owner: 'Client IT' },
  { id: 'F8', group: 'Technical limitation', item: 'Rate limit of 60 calls/minute, bulk status update not supported', status: 'Pending client', owner: '2COMS Tech' },
  { id: 'F9', group: 'Technical limitation', item: 'IP allow-listing for 2COMS servers', status: 'Confirmed', owner: 'Client IT' },
];

/* ----------------------------- Notifications ----------------------------- */

export type NotificationStatus = 'Live' | 'Ready for QA' | 'In development' | 'Pending';
export type NotificationChannel = 'push' | 'email' | 'sms';

export interface NotificationEvent {
  id: string;
  event: string;
  status: NotificationStatus;
  channels: Record<NotificationChannel, boolean>;
  template: string;
  owner: string;
}

export const NOTIFICATION_VARIABLES = ['{employee_name}', '{time}', '{date}', '{shift}', '{client}', '{reason}', '{hours}'];

const ev = (
  id: string,
  event: string,
  status: NotificationStatus,
  channels: [boolean, boolean, boolean],
  template: string,
  owner: string,
): NotificationEvent => ({ id, event, status, channels: { push: channels[0], email: channels[1], sms: channels[2] }, template, owner });

export const INITIAL_NOTIFICATION_EVENTS: NotificationEvent[] = [
  ev('N1', 'Clock-in reminder', 'Live', [true, false, false], 'Hi {employee_name}, your {shift} shift starts at {time}. Do not forget to clock in.', 'Mobile team'),
  ev('N2', 'Clock-out reminder', 'Live', [true, false, false], 'Hi {employee_name}, your shift ended at {time}. Please clock out.', 'Mobile team'),
  ev('N3', 'Missed punch', 'Ready for QA', [false, false, false], 'Hi {employee_name}, we found a missed punch on {date}. Raise a regularization request.', 'Mobile team'),
  ev('N4', 'Late arrival', 'Ready for QA', [false, false, false], 'Hi {employee_name}, you clocked in at {time} on {date}, after your {shift} shift start.', 'Mobile team'),
  ev('N5', 'Early exit', 'In development', [false, false, false], 'Hi {employee_name}, you clocked out early on {date} ({hours} hrs short).', 'Mobile team'),
  ev('N6', 'Regularization approved', 'In development', [false, false, false], 'Your regularization for {date} has been approved.', 'Backend team'),
  ev('N7', 'Regularization rejected', 'In development', [false, false, false], 'Your regularization for {date} was rejected. Reason: {reason}.', 'Backend team'),
  ev('N8', 'Overtime approved', 'Pending', [false, false, false], 'Your overtime of {hours} hrs on {date} for {client} has been approved.', 'Backend team'),
  ev('N9', 'Shift change', 'Pending', [false, false, false], 'Your shift has changed to {shift} from {date}.', 'Backend team'),
  ev('N10', 'Weekly-off change', 'Pending', [false, false, false], 'Your weekly off has been updated. New weekly off applies from {date}.', 'Backend team'),
  ev('N11', 'Holiday announcement', 'Pending', [false, false, false], '{client} has declared a holiday on {date}. Enjoy the day off.', 'Product'),
  ev('N12', 'Leave approved', 'Pending', [false, false, false], 'Your leave for {date} has been approved.', 'Backend team'),
  ev('N13', 'Leave rejected', 'Pending', [false, false, false], 'Your leave for {date} was rejected. Reason: {reason}.', 'Backend team'),
];

export interface NotificationDeliveryRow {
  eventId: string;
  event: string;
  channel: string;
  sent: number;
  delivered: number;
  failed: number;
  lastSent: string;
}

export const NOTIFICATION_DELIVERY_LOG: NotificationDeliveryRow[] = [
  { eventId: 'N1', event: 'Clock-in reminder', channel: 'Push', sent: 4820, delivered: 4731, failed: 89, lastSent: '05 Oct 2026, 08:45 AM' },
  { eventId: 'N1', event: 'Clock-in reminder', channel: 'SMS', sent: 276, delivered: 259, failed: 17, lastSent: '05 Oct 2026, 08:45 AM' },
  { eventId: 'N2', event: 'Clock-out reminder', channel: 'Push', sent: 3965, delivered: 3902, failed: 63, lastSent: '04 Oct 2026, 06:30 PM' },
  { eventId: 'N2', event: 'Clock-out reminder', channel: 'SMS', sent: 410, delivered: 388, failed: 22, lastSent: '04 Oct 2026, 06:30 PM' },
];
