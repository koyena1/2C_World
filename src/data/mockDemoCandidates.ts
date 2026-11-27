import type { Candidate, JoiningStatus, KycDocumentStatus, KycRecord, PennyTestStatus } from '../types/onboarding';
import { addDaysIso, todayIso } from '../utils/today';

/**
 * Demo cohort: ~100 candidates registered and joining across the last ~4 months up to today (and joiners in the
 * next weeks), so the Dashboard date filter shows visibly different numbers for different days and ranges.
 * Dates are generated relative to the real current date; every record is internally consistent
 * (registered -> offer issued -> accepted -> KYC verified -> joined).
 */

/* Small deterministic generator: the same demo data on every load. */
const makeRng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const FIRST_F = ['Aditi', 'Neha', 'Pooja', 'Kavya', 'Shreya', 'Ritika', 'Tanvi', 'Meera', 'Ananya', 'Divya', 'Swati', 'Nisha', 'Isha', 'Radhika', 'Sanya', 'Lakshmi'];
const FIRST_M = ['Rohan', 'Arjun', 'Vikram', 'Karan', 'Siddharth', 'Manish', 'Aman', 'Nikhil', 'Harsh', 'Deepak', 'Imran', 'Gaurav', 'Rahul', 'Suresh', 'Varun', 'Abhishek'];
const LAST = ['Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Banerjee', 'Chatterjee', 'Kulkarni', 'Patil', 'Singh', 'Gupta', 'Mehta', 'Joshi', 'Das', 'Menon', 'Rao', 'Bhatt', 'Kapoor', 'Mishra', 'Pillai', 'Shah', 'Khan'];

interface ClientProfile {
  id: string;
  name: string;
  code: string;
  roles: Array<{ designation: string; department: string }>;
  locations: string[];
  bank: { name: string; ifsc: string };
  salary: [number, number];
}

const CLIENTS: ClientProfile[] = [
  { id: 'client-tcs', name: 'Tata Consultancy Services', code: 'TCS', roles: [{ designation: 'Senior Java Developer', department: 'Digital Enterprise Solutions' }, { designation: 'Cloud Infrastructure Specialist', department: 'Cloud, Infrastructure and Security (CIS)' }, { designation: 'QA Automation Lead', department: 'Corporate Quality & Process' }], locations: ['Bangalore - Whitefield', 'Kolkata - Salt Lake', 'Pune - Hinjewadi'], bank: { name: 'HDFC Bank Ltd', ifsc: 'HDFC0000029' }, salary: [52000, 98000] },
  { id: 'client-flipkart', name: 'Flipkart Internet Pvt Ltd', code: 'FKT', roles: [{ designation: 'Supply Chain Operations Lead', department: 'Logistics & Fulfilment' }, { designation: 'Inventory Operations Specialist', department: 'Warehouse Operations' }], locations: ['Gurgaon - Cyber City', 'Bangalore - Bellandur', 'Kolkata - Dankuni'], bank: { name: 'ICICI Bank Ltd', ifsc: 'ICIC0000104' }, salary: [24000, 72000] },
  { id: 'client-infosys', name: 'Infosys Technologies', code: 'INF', roles: [{ designation: 'Cybersecurity Analyst', department: 'Cloud, Infrastructure and Security (CIS)' }, { designation: 'Frontend React Developer', department: 'Interactive Experiences' }, { designation: 'Database Architect', department: 'Enterprise Data Platforms' }], locations: ['Hyderabad - HITEC City', 'Bangalore - Electronic City', 'Chennai - Siruseri'], bank: { name: 'Axis Bank Ltd', ifsc: 'UTIB0000012' }, salary: [48000, 105000] },
  { id: 'client-reliance', name: 'Reliance Retail Ltd', code: 'RRL', roles: [{ designation: 'Store Operations Manager', department: 'Omnichannel Retail & Merchandising' }, { designation: 'Inventory Operations Specialist', department: 'Warehouse Operations' }], locations: ['Mumbai - Andheri', 'Kolkata - Park Street', 'Delhi - Okhla'], bank: { name: 'State Bank of India', ifsc: 'SBIN0000300' }, salary: [22000, 61000] },
  { id: 'client-lt', name: 'Larsen & Toubro Ltd', code: 'LNT', roles: [{ designation: 'Site Planning Engineer', department: 'Heavy Civil Infrastructure' }, { designation: 'Quantity Surveyor', department: 'Projects & Contracts' }], locations: ['Mumbai - Powai', 'Chennai - Manapakkam', 'Kolkata - New Town'], bank: { name: 'HDFC Bank Ltd', ifsc: 'HDFC0000060' }, salary: [38000, 84000] },
  { id: 'client-hdfc', name: 'HDFC Bank Ltd', code: 'HDF', roles: [{ designation: 'Branch Relationship Manager', department: 'Retail Banking & Wealth' }, { designation: 'Risk & Credit Analyst', department: 'Credit & Risk Operations' }], locations: ['Kolkata - Park Street', 'Mumbai - Lower Parel', 'Pune - Kharadi'], bank: { name: 'HDFC Bank Ltd', ifsc: 'HDFC0000240' }, salary: [30000, 78000] },
  { id: 'client-wipro', name: 'Wipro Digital', code: 'WIP', roles: [{ designation: 'AI/ML Solutions Engineer', department: 'Enterprise Artificial Intelligence' }, { designation: 'Frontend React Developer', department: 'Interactive Experiences' }], locations: ['Bangalore - Sarjapur', 'Hyderabad - Gachibowli', 'Kolkata - Salt Lake'], bank: { name: 'Kotak Mahindra Bank', ifsc: 'KKBK0000958' }, salary: [50000, 102000] },
];

const RECRUITERS = [
  { name: 'Ananya Mukherjee', email: 'ananya.m@2coms.com' },
  { name: 'Kunal Sen', email: 'kunal.s@2coms.com' },
  { name: 'Deepak Rao', email: 'deepak.r@2coms.com' },
  { name: 'Sneha Kapoor', email: 'sneha.k@2coms.com' },
];
const SOURCES: Candidate['source'][] = ['Naukri', 'LinkedIn', 'Internal Referral', 'Campus', 'Vendor'];
const QUALIFICATIONS = ['B.Tech in Computer Science', 'B.Com (Honours)', 'MBA (Operations)', 'B.E. Civil Engineering', 'B.Sc. Information Technology', 'M.Com', 'Diploma in Logistics'];
const MISSING_POOL = ['PF Nominee Aadhaar Card Copy', 'Previous Employment Relieving Letter', 'Passport Size Photograph', 'Highest Qualification Certificate', 'Cancelled Cheque Copy', 'Address Proof (Current)'];
const BLOOD = ['A+', 'B+', 'O+', 'AB+', 'O-', 'B-'];

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (iso: string, hour: number, minute: number) => {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${iso} ${pad(h12)}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}`;
};
const digits = (n: number, len: number) => String(Math.abs(n * 7919 + 13579) % 10 ** len).padStart(len, '0');
const maskAadhaar = (n: string) => `XXXX-XXXX-${n.slice(-4)}`;

const DOCS: KycRecord['documentType'][] = ['Aadhaar', 'PAN', 'Bank', 'UAN'];

const FILE_NAMES: Record<KycRecord['documentType'], string> = {
  Aadhaar: 'Aadhaar_Front_Back_eKYC.pdf',
  PAN: 'PAN_Card_Original_Scan.jpg',
  Bank: 'Cancelled_Cheque_Scan.jpg',
  UAN: 'EPFO_Member_Passbook.pdf',
};
const VERIFIERS: Record<KycRecord['documentType'], string> = {
  Aadhaar: 'UIDAI API (Instant)',
  PAN: 'NSDL / NSDL-Protean API',
  Bank: 'Razorpay Penny Drop',
  UAN: 'EPFO Unified Portal API',
};

const buildKyc = (
  i: number,
  doc: KycRecord['documentType'],
  status: KycDocumentStatus,
  at: string,
  fullName: string,
  bankName: string,
  accountNumber: string,
  ifsc: string
): KycRecord => {
  const upper = fullName.toUpperCase();
  const number =
    doc === 'Aadhaar' ? maskAadhaar(digits(i, 12)) : doc === 'PAN' ? `ABCPD${digits(i, 4)}K` : doc === 'Bank' ? accountNumber : digits(i + 5, 12);
  const uploaded = status !== 'Not Started';
  const mismatch = status === 'API Mismatch';
  const match = status === 'Verified' ? 100 - (i % 3) : mismatch ? 61 + (i % 12) : status === 'Pending Manual Review' ? 70 + (i % 20) : status === 'Rejected' ? 40 : 0;
  return {
    id: `kyc-d${i}-${doc.toLowerCase()}`,
    documentType: doc,
    documentNumber: number,
    apiSearchValue: doc === 'Bank' ? `${accountNumber} (${ifsc})` : number,
    nameInSystem: fullName,
    nameInApi: status === 'Not Started' ? '' : mismatch ? upper.replace(/[AEIOU]/, 'X') : upper,
    candidateSubmittedValue: fullName,
    matchPercentage: match,
    status,
    lastUpdated: stamp(at, 11 + (i % 6), (i * 7) % 60),
    verifiedBy: status === 'Verified' ? VERIFIERS[doc] : undefined,
    remarks:
      doc === 'Bank' && status === 'Verified'
        ? '₹1.00 credited successfully. Account holder name matches.'
        : doc === 'Bank' && status === 'Rejected'
        ? '₹1.00 credit failed. Account closed or inactive.'
        : undefined,
    documentFileName: uploaded ? FILE_NAMES[doc] : undefined,
    documentUploadedAt: uploaded ? stamp(at, 10, (i * 3) % 60) : undefined,
    documentAvailability: uploaded ? 'Document Uploaded' : 'Missing Document',
    documentSize: uploaded ? `${900 + ((i * 131) % 1800)} KB` : undefined,
    uploadedBy: uploaded ? `${fullName} (Mobile App)` : undefined,
    auditTrail: uploaded
      ? [{ id: `a-d${i}-${doc[0].toLowerCase()}`, action: status === 'Verified' ? 'API Verified' : 'Queued for manual review', timestamp: stamp(at, 11 + (i % 6), (i * 7) % 60), actor: status === 'Verified' ? 'Automated Verification Gateway' : 'System', notes: status === 'Verified' ? 'Verification success with high name match.' : 'Needs reviewer attention.' }]
      : [],
  };
};

export const buildDemoCandidates = (count = 100): Candidate[] => {
  const today = todayIso();
  const rng = makeRng(20261126);
  const pick = <T,>(list: T[]) => list[Math.floor(rng() * list.length)];
  const out: Candidate[] = [];

  for (let i = 0; i < count; i += 1) {
    // Registered over the last ~125 days, denser in the last two weeks so every recent day has activity.
    const regAgo = i < 36 ? i % 14 : 14 + Math.floor(((i - 36) / (count - 36)) * 112) + Math.floor(rng() * 3);
    const registrationDate = addDaysIso(today, -regAgo);
    const dateOfInterview = addDaysIso(registrationDate, -(2 + Math.floor(rng() * 4)));
    const dateOfJoining = addDaysIso(registrationDate, 9 + Math.floor(rng() * 19));
    const joinsInPast = dateOfJoining <= today;

    const client = CLIENTS[i % CLIENTS.length];
    const role = client.roles[Math.floor(rng() * client.roles.length)];
    const female = rng() < 0.45;
    const firstName = pick(female ? FIRST_F : FIRST_M);
    const lastName = pick(LAST);
    const fullName = `${firstName} ${lastName}`;
    const recruiter = RECRUITERS[(i * 3 + Math.floor(rng() * 2)) % RECRUITERS.length];
    const accountNumber = `00${digits(i + 3, 14)}`;
    const salary = Math.round((client.salary[0] + rng() * (client.salary[1] - client.salary[0])) / 500) * 500;

    // Joining status from the timeline
    let joiningStatus: JoiningStatus;
    const roll = rng();
    if (joinsInPast) {
      joiningStatus = roll < 0.74 ? 'Joined' : roll < 0.83 ? 'Dropout' : roll < 0.91 ? 'Offer Dropped' : roll < 0.96 ? 'Deferred' : 'Yet to Join';
    } else {
      joiningStatus = roll < 0.4 ? 'Yet to Join' : roll < 0.7 ? 'Offer Accepted' : 'Verification In Progress';
    }
    const joined = joiningStatus === 'Joined';
    const dropped = joiningStatus === 'Dropout' || joiningStatus === 'Offer Dropped' || joiningStatus === 'Deferred';

    // KYC progress grows with the days since registration (and is complete for joiners).
    const age = Math.max(0, regAgo);
    const progress = joined ? 1 : Math.min(1, age / 9);
    const docStatuses: KycDocumentStatus[] = DOCS.map((doc) => {
      if (joined) return doc === 'UAN' && rng() < 0.12 ? 'Skipped' : 'Verified';
      if (dropped) return rng() < 0.5 ? 'Verified' : rng() < 0.5 ? 'Pending Manual Review' : 'Not Started';
      const r = rng();
      if (r < progress * 0.78) return 'Verified';
      if (r < progress * 0.78 + 0.12) return 'Pending Manual Review';
      if (r < progress * 0.78 + 0.16 && doc !== 'UAN') return 'API Mismatch';
      if (r < progress * 0.78 + 0.18 && doc === 'Bank') return 'Rejected';
      return age < 2 ? 'Not Started' : 'Pending Manual Review';
    });
    const verifiedOn = (d: number) => {
      const iso = addDaysIso(registrationDate, 1 + ((i + d) % 4));
      return iso > today ? today : iso;
    };
    const kycRecords = DOCS.map((doc, d) => buildKyc(i, doc, docStatuses[d], verifiedOn(d), fullName, client.bank.name, accountNumber, client.bank.ifsc));

    const statuses = docStatuses.filter((s) => s !== 'Skipped');
    const overallKycStatus: KycDocumentStatus = statuses.every((s) => s === 'Verified')
      ? 'Verified'
      : statuses.includes('Rejected')
      ? 'Rejected'
      : statuses.includes('API Mismatch')
      ? 'API Mismatch'
      : statuses.every((s) => s === 'Not Started')
      ? 'Not Started'
      : 'Pending Manual Review';
    const bankStatus = docStatuses[2];
    const pennyTestStatus: PennyTestStatus = bankStatus === 'Verified' ? 'Verified' : bankStatus === 'Rejected' ? 'Failed' : bankStatus === 'Not Started' ? 'Not Sent' : 'Pending';

    // Letters: offer issued the day after registration (a few very recent registrations have none yet).
    const offerIssued = addDaysIso(registrationDate, 1);
    const hasOffer = !(regAgo <= 2 && rng() < 0.5) && offerIssued <= today;
    const letters: Candidate['letters'] = [];
    if (hasOffer) {
      const accepted = joined || (!dropped && rng() < 0.82) || (dropped && rng() < 0.5);
      const acceptedOn = addDaysIso(offerIssued, 1 + Math.floor(rng() * 3));
      if (accepted && acceptedOn <= today) {
        letters.push({ id: `let-d${i}-1`, title: `Offer Letter - 2COMS ${client.code} Deputation`, issuedDate: offerIssued, status: 'Accepted', acceptedDate: stamp(acceptedOn, 10 + (i % 6), (i * 11) % 60) });
        const apptIssued = addDaysIso(dateOfJoining, -4);
        if (apptIssued <= today && !dropped) {
          letters.push({ id: `let-d${i}-2`, title: 'Appointment Letter & Code of Conduct', issuedDate: apptIssued, status: joined && rng() < 0.85 ? 'Accepted' : 'Pending Acceptance' });
          const last = letters[letters.length - 1];
          if (last.status === 'Accepted') last.acceptedDate = stamp(addDaysIso(apptIssued, 1), 12, 30);
        }
      } else {
        letters.push({ id: `let-d${i}-1`, title: `Offer Letter - 2COMS ${client.code} Deputation`, issuedDate: offerIssued, status: rng() < 0.2 ? 'Draft' : 'Pending Acceptance' });
      }
    }

    const missingFields = joined || dropped || rng() < 0.6 ? [] : Array.from(new Set([pick(MISSING_POOL), ...(rng() < 0.3 ? [pick(MISSING_POOL)] : [])]));
    const completion = joined ? 100 : Math.min(96, Math.max(12, Math.round(18 + progress * 62 + rng() * 14 - missingFields.length * 5)));

    out.push({
      id: `cand-${200 + i}`,
      userId: `2C-2026-${9100 + i}`,
      // Portrait photographs; a few candidates have none yet, so the ID card module can flag them.
      avatarUrl: i % 11 === 4 ? undefined : `https://randomuser.me/api/portraits/${female ? 'women' : 'men'}/${(i * 7) % 90}.jpg`,
      firstName,
      lastName,
      email: `${firstName}.${lastName}${i % 9 === 0 ? i : ''}@example.com`.toLowerCase(),
      phone: `+91 9${digits(i + 11, 4)} ${digits(i + 41, 5)}`,
      whatsappNumber: `+91 9${digits(i + 11, 4)} ${digits(i + 41, 5)}`,
      emergencyContact: `+91 9${digits(i + 71, 4)} ${digits(i + 91, 5)} (${female ? 'Father' : 'Mother'} - ${pick(female ? FIRST_M : FIRST_F)} ${lastName})`,
      clientId: client.id,
      clientName: client.name,
      designation: role.designation,
      department: role.department,
      workLocation: pick(client.locations),
      dateOfInterview,
      dateOfJoining,
      endOfContract: addDaysIso(dateOfJoining, 364),
      grossSalaryMonthly: salary,
      clientCandidateCode: `${client.code}-${pick(['BLR', 'KOL', 'HYD', 'MUM', 'PUN'])}-${5000 + i}`,
      source: pick(SOURCES),
      recruiterName: recruiter.name,
      recruiterEmail: recruiter.email,
      registrationDate,
      joiningStatus,
      pennyTestStatus,
      pennyTestAmount: pennyTestStatus === 'Verified' ? 1.0 : undefined,
      pennyTestAccountHolder: pennyTestStatus === 'Verified' ? fullName.toUpperCase() : undefined,
      onboardingCompletionPct: completion,
      overallKycStatus,
      kycRecords,
      bankName: client.bank.name,
      accountNumber,
      ifscCode: client.bank.ifsc,
      branchName: `${pick(['MG Road', 'Park Street', 'Andheri East', 'Salt Lake', 'Koramangala'])} Branch`,
      accountHolderName: fullName,
      gender: female ? 'Female' : 'Male',
      dob: `${1990 + (i % 10)}-${pad(1 + (i % 12))}-${pad(1 + ((i * 3) % 28))}`,
      bloodGroup: i % 29 === 3 ? '' : BLOOD[i % BLOOD.length],
      maritalStatus: i % 4 === 0 ? 'Married' : 'Single',
      highestQualification: pick(QUALIFICATIONS),
      fatherName: `${pick(FIRST_M)} ${lastName}`,
      motherName: `${pick(FIRST_F)} ${lastName}`,
      currentAddress: `Flat ${100 + (i % 80)}, ${pick(['Lake View Apartments', 'Green Park Residency', 'Sunrise Heights', 'Orchid Towers'])}, ${client.locations[0].split(' - ')[0]}`,
      permanentAddress: `House ${10 + (i % 60)}, ${pick(['Gandhi Nagar', 'Nehru Colony', 'Rajaji Road', 'Station Road'])}, ${pick(['Patna', 'Lucknow', 'Bhopal', 'Jaipur', 'Nagpur'])}`,
      documents: [
        { id: `doc-d${i}-1`, name: 'Aadhaar_Front_Back.pdf', category: 'Identity', uploadedAt: addDaysIso(registrationDate, 1), status: docStatuses[0] === 'Verified' ? 'Verified' : 'Pending Review', size: '1.2 MB' },
        { id: `doc-d${i}-2`, name: 'PAN_Card_Copy.pdf', category: 'Identity', uploadedAt: addDaysIso(registrationDate, 1), status: docStatuses[1] === 'Verified' ? 'Verified' : 'Pending Review', size: '850 KB' },
        { id: `doc-d${i}-3`, name: 'Degree_Certificate.pdf', category: 'Education', uploadedAt: addDaysIso(registrationDate, 2), status: joined ? 'Verified' : 'Pending Review', size: '3.1 MB' },
      ],
      letters,
      missingFields,
    });
  }
  return out;
};

export const DEMO_CANDIDATES: Candidate[] = buildDemoCandidates();
