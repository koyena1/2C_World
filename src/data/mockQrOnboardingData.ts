import { DASHBOARD_REFERENCE_DATE } from '../modules/dashboard/dashboard.metrics';

export type QrStatus = 'Active' | 'Expired' | 'Revoked';

export interface QrCodeRecord {
  id: string;
  clientName: string;
  /** Client-wise code, e.g. QR-TCS-2610-0042 */
  code: string;
  link: string;
  createdBy: string;
  createdAt: string; // YYYY-MM-DD
  expiresOn: string; // YYYY-MM-DD
  usageLimit: number;
  scans: number;
  submissions: number;
  status: QrStatus;
  designation: string;
  workLocation: string;
  recruiterName: string;
  source: string;
}

export interface QrSubmission {
  id: string;
  qrCode: string;
  clientName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  submittedAt: string;
  designation: string;
  workLocation: string;
  recruiterName: string;
  source: string;
}

/** Each client owns a code prefix so QR codes can be grouped and traced client-wise. */
export const QR_CLIENT_PREFIX: Record<string, string> = {
  'Tata Consultancy Services': 'TCS',
  'Flipkart Internet Pvt Ltd': 'FKT',
  'HDFC Bank Ltd': 'HDFC',
  'Infosys Technologies': 'INFY',
  'Larsen & Toubro Ltd': 'LNT',
  'Reliance Retail Ltd': 'RRL',
  'Wipro Digital': 'WIPR',
};

export const clientPrefix = (client: string): string =>
  QR_CLIENT_PREFIX[client] ?? client.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase().padEnd(3, 'X');

/** "2026-10-05" -> "2610" */
const yymm = (iso: string) => iso.slice(2, 4) + iso.slice(5, 7);

export const buildQrCode = (client: string, seq: number, onDate = DASHBOARD_REFERENCE_DATE): string =>
  `QR-${clientPrefix(client)}-${yymm(onDate)}-${String(seq).padStart(4, '0')}`;

export const buildQrLink = (code: string): string => `https://connect.2coms.com/onboard/qr/${code}`;

const rec = (
  n: number,
  clientName: string,
  seq: number,
  month: string,
  createdAt: string,
  expiresOn: string,
  usageLimit: number,
  scans: number,
  submissions: number,
  status: QrStatus,
  createdBy: string,
  designation: string,
  workLocation: string,
  recruiterName: string,
  source: string
): QrCodeRecord => {
  const code = buildQrCode(clientName, seq, month);
  return {
    id: `QR-${n}`,
    clientName,
    code,
    link: buildQrLink(code),
    createdBy,
    createdAt,
    expiresOn,
    usageLimit,
    scans,
    submissions,
    status,
    designation,
    workLocation,
    recruiterName,
    source,
  };
};

export const SEED_QR_CODES: QrCodeRecord[] = [
  rec(1, 'Tata Consultancy Services', 42, '2026-10-01', '2026-10-01', '2026-10-31', 200, 118, 64, 'Active', 'Ananya (Ops Lead)', 'Associate Engineer', 'Bangalore - Whitefield', 'Ananya Mukherjee', 'Campus Placement Drive'),
  rec(2, 'Tata Consultancy Services', 37, '2026-09-10', '2026-09-10', '2026-09-30', 100, 96, 71, 'Expired', 'Ananya (Ops Lead)', 'Systems Engineer', 'Pune - Hinjewadi', 'Ananya Mukherjee', 'Direct Walk-in'),
  rec(3, 'Infosys Technologies', 18, '2026-10-02', '2026-10-02', '2026-11-15', 150, 54, 29, 'Active', 'Vikram (Client HR)', 'Process Executive', 'Chennai - Mahindra World City', 'Rohit Nair', 'Job Fair'),
  rec(4, 'HDFC Bank Ltd', 9, '2026-09-22', '2026-09-22', '2026-10-22', 80, 41, 17, 'Revoked', 'Ananya (Ops Lead)', 'Relationship Officer', 'Mumbai - Lower Parel', 'Sneha Kulkarni', 'Staffing Vendor / Partner'),
  rec(5, 'Flipkart Internet Pvt Ltd', 24, '2026-10-03', '2026-10-03', '2026-10-20', 120, 87, 52, 'Active', 'Vikram (Client HR)', 'Warehouse Associate', 'Gurgaon - Cyber City', 'Karan Mehta', 'Direct Walk-in'),
  rec(6, 'Reliance Retail Ltd', 11, '2026-09-05', '2026-09-05', '2026-10-04', 60, 38, 22, 'Expired', 'Ananya (Ops Lead)', 'Store Executive', 'Mumbai - Lower Parel', 'Sneha Kulkarni', 'Job Fair'),
];

export const SEED_QR_SUBMISSIONS: QrSubmission[] = [
  { id: 'QS-1', qrCode: 'QR-TCS-2610-0042', clientName: 'Tata Consultancy Services', firstName: 'Aditya', lastName: 'Menon', email: 'aditya.menon@example.com', phone: '+91 98450 11223', emergencyContact: '+91 98450 99887', submittedAt: '2026-10-04 06:12 PM', designation: 'Associate Engineer', workLocation: 'Bangalore - Whitefield', recruiterName: 'Ananya Mukherjee', source: 'Campus Placement Drive' },
  { id: 'QS-2', qrCode: 'QR-TCS-2610-0042', clientName: 'Tata Consultancy Services', firstName: 'Meera', lastName: 'Iyer', email: 'meera.iyer@example.com', phone: '+91 99020 44556', emergencyContact: '+91 99020 11000', submittedAt: '2026-10-04 07:40 PM', designation: 'Associate Engineer', workLocation: 'Bangalore - Whitefield', recruiterName: 'Ananya Mukherjee', source: 'Campus Placement Drive' },
  { id: 'QS-3', qrCode: 'QR-INFY-2610-0018', clientName: 'Infosys Technologies', firstName: 'Faisal', lastName: 'Khan', email: 'faisal.khan@example.com', phone: '+91 97910 32145', emergencyContact: '+91 97910 66778', submittedAt: '2026-10-05 10:05 AM', designation: 'Process Executive', workLocation: 'Chennai - Mahindra World City', recruiterName: 'Rohit Nair', source: 'Job Fair' },
  { id: 'QS-4', qrCode: 'QR-FKT-2610-0024', clientName: 'Flipkart Internet Pvt Ltd', firstName: 'Pooja', lastName: 'Chauhan', email: 'pooja.chauhan@example.com', phone: '+91 98110 76543', emergencyContact: '+91 98110 22334', submittedAt: '2026-10-05 11:20 AM', designation: 'Warehouse Associate', workLocation: 'Gurgaon - Cyber City', recruiterName: 'Karan Mehta', source: 'Direct Walk-in' },
  { id: 'QS-5', qrCode: 'QR-FKT-2610-0024', clientName: 'Flipkart Internet Pvt Ltd', firstName: 'Suresh', lastName: 'Yadav', email: 'suresh.yadav@example.com', phone: '+91 99710 55667', emergencyContact: '+91 99710 88990', submittedAt: '2026-10-05 12:02 PM', designation: 'Warehouse Associate', workLocation: 'Gurgaon - Cyber City', recruiterName: 'Karan Mehta', source: 'Direct Walk-in' },
];
