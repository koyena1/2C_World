import type { Candidate } from '../../types/onboarding';
import type { Sheet } from '../../utils/spreadsheet';
import { writeXlsx } from '../../utils/spreadsheet';
import { addDaysIso, todayIso } from '../../utils/today';
import { employeeIdOf, fullName, idCardIssues } from './idCardRender';
import type { IdCardRecord } from './idCardStore';

/* ------------------------------------------------------------------ */
/* Columns                                                             */
/* ------------------------------------------------------------------ */

export type ColKey =
  | 'employeeId'
  | 'candidateId'
  | 'name'
  | 'client'
  | 'designation'
  | 'department'
  | 'location'
  | 'joiningDate'
  | 'contact'
  | 'bloodGroup'
  | 'emergency'
  | 'dob'
  | 'photo';

export interface ImportColumn {
  key: ColKey;
  label: string;
  /** 'id' = one of Employee ID / Candidate ID is required, 'yes' = always required. */
  required: 'yes' | 'id' | 'no';
  format: string;
  example: string;
  note: string;
  aliases: string[];
  width: number;
}

export const IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'employeeId', label: 'Employee ID', required: 'id', format: 'Letters, digits, - _ /', example: 'TCS-BLR-4892', note: 'Matches an existing candidate. Candidate ID or Employee ID is required (both is best).', aliases: ['employeeid', 'empid', 'employeecode', 'empcode', 'employeeno'], width: 18 },
  { key: 'candidateId', label: 'Candidate ID', required: 'id', format: 'As shown in the Candidate Directory', example: '2C-2026-8941', note: 'The User ID of an existing candidate. Candidates are never created by this import.', aliases: ['candidateid', 'userid', 'candidatecode', 'candidateno'], width: 18 },
  { key: 'name', label: 'Candidate Name', required: 'yes', format: 'First and last name', example: 'Priya Sharma', note: 'Printed on the card. A difference from the candidate record is flagged, never silently applied.', aliases: ['candidatename', 'name', 'employeename', 'fullname'], width: 24 },
  { key: 'client', label: 'Client', required: 'yes', format: 'Client name', example: 'Tata Consultancy Services', note: 'Must match the candidate record (the client is never changed by an import).', aliases: ['client', 'clientname', 'company'], width: 28 },
  { key: 'designation', label: 'Designation', required: 'yes', format: 'Job title', example: 'Senior Java Developer', note: 'Printed on the card.', aliases: ['designation', 'jobtitle', 'role', 'position'], width: 26 },
  { key: 'department', label: 'Department', required: 'yes', format: 'Department name', example: 'Digital Enterprise Solutions', note: 'Printed on the card.', aliases: ['department', 'dept'], width: 28 },
  { key: 'location', label: 'Location', required: 'yes', format: 'City - site', example: 'Bangalore - Whitefield', note: 'Work location / branch, printed on the card.', aliases: ['location', 'worklocation', 'branch', 'site'], width: 24 },
  { key: 'joiningDate', label: 'Joining Date', required: 'yes', format: 'YYYY-MM-DD or DD-MM-YYYY', example: '2026-12-01', note: 'Excel date cells are fine too.', aliases: ['joiningdate', 'dateofjoining', 'doj', 'joindate'], width: 16 },
  { key: 'contact', label: 'Contact Number', required: 'yes', format: 'At least 10 digits', example: '+91 98201 54321', note: 'Candidate mobile number.', aliases: ['contactnumber', 'contact', 'phone', 'phonenumber', 'mobile', 'mobilenumber'], width: 18 },
  { key: 'bloodGroup', label: 'Blood Group', required: 'yes', format: 'A+, A-, B+, B-, O+, O-, AB+, AB-', example: 'B+', note: 'Printed on the card.', aliases: ['bloodgroup', 'blood'], width: 12 },
  { key: 'emergency', label: 'Emergency Contact', required: 'yes', format: 'Number and relation', example: '+91 98201 99999 (Father - Ramesh Sharma)', note: 'Printed on the back of the card.', aliases: ['emergencycontact', 'emergencynumber', 'emergencyphone'], width: 34 },
  { key: 'dob', label: 'Date of Birth', required: 'no', format: 'YYYY-MM-DD or DD-MM-YYYY', example: '1996-04-18', note: 'Optional.', aliases: ['dateofbirth', 'dob', 'birthdate'], width: 16 },
  { key: 'photo', label: 'Photo', required: 'no', format: 'File name or image URL', example: 'priya_sharma.jpg', note: 'Optional here: you can map photograph files after upload. A card needs a photograph.', aliases: ['photo', 'photograph', 'photofile', 'photofilename', 'photourl', 'image'], width: 24 },
];

const COLS = new Map(IMPORT_COLUMNS.map((c) => [c.key, c]));
export const colLabel = (k: ColKey) => COLS.get(k)?.label ?? k;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const aliasMap = new Map<string, ColKey>();
IMPORT_COLUMNS.forEach((c) => {
  aliasMap.set(norm(c.label), c.key);
  c.aliases.forEach((a) => aliasMap.set(a, c.key));
});

/* ------------------------------------------------------------------ */
/* Template                                                            */
/* ------------------------------------------------------------------ */

export const TEMPLATE_SHEET = 'ID Card Data';

/** The downloadable template: a data sheet (header + sample rows from real candidates) and an instructions sheet. */
export const buildTemplate = (candidates: Candidate[]): Blob => {
  const samples = candidates
    .filter((c) => idCardIssues(c).filter((i) => i !== 'Photograph').length === 0)
    .slice(0, 3)
    .map((c) => [employeeIdOf(c), c.userId, fullName(c), c.clientName, c.designation, c.department, c.workLocation, c.dateOfJoining, c.phone, c.bloodGroup, c.emergencyContact, c.dob ?? '', '']);
  const header = IMPORT_COLUMNS.map((c) => c.label);
  const instructions: string[][] = [
    ['2COMS Connect - ID Card Import template'],
    ['1. Fill the "ID Card Data" sheet: one row per candidate. Keep the header row exactly as it is.'],
    ['2. Candidates must already exist in the portal. A row is matched by Candidate ID or Employee ID; unknown people are rejected (no candidate is ever created).'],
    ['3. The sheet never overwrites a candidate record by itself. Differences are shown on screen and only applied if you tick "Update candidate record".'],
    ['4. Rows 2-4 of the data sheet are samples taken from existing candidates. Replace or delete them.'],
    ['5. Photographs: put a file name (or image URL) in the Photo column and map the files after upload, or upload each photograph on screen.'],
    [''],
    ['Column', 'Required', 'Format', 'Example', 'Notes'],
    ...IMPORT_COLUMNS.map((c) => [c.label, c.required === 'yes' ? 'Yes' : c.required === 'id' ? 'One of Employee ID / Candidate ID' : 'No', c.format, c.example, c.note]),
  ];
  return writeXlsx([
    { name: TEMPLATE_SHEET, rows: [header, ...samples], headerRow: true, widths: IMPORT_COLUMNS.map((c) => c.width), freezeHeader: true },
    { name: 'Instructions', rows: instructions, wrap: true, widths: [30, 26, 34, 34, 70] },
  ]);
};

/* ------------------------------------------------------------------ */
/* Parsing a worksheet                                                 */
/* ------------------------------------------------------------------ */

export type RowValues = Record<ColKey, string>;

export interface ImportRow {
  /** Row number in the file (Excel row), shown in messages. */
  rowNo: number;
  values: RowValues;
  /** Replace the candidate record's values with the sheet's (explicit choice). */
  apply: boolean;
  /** Photograph uploaded / mapped during this import (data URL). */
  photoData?: string;
}

export interface ParsedFile {
  sheetName: string;
  rows: ImportRow[];
  /** Columns the sheet is missing. */
  missing: ColKey[];
  /** Columns present but not recognised (ignored). */
  ignored: string[];
}

const emptyValues = (): RowValues => Object.fromEntries(IMPORT_COLUMNS.map((c) => [c.key, ''])) as RowValues;

export const MAX_IMPORT_ROWS = 500;

export const parseSheets = (sheets: Sheet[]): ParsedFile => {
  // Prefer the template's data sheet, else the first sheet that has a recognisable header.
  const ordered = [...sheets].sort((a, b) => (a.name === TEMPLATE_SHEET ? -1 : b.name === TEMPLATE_SHEET ? 1 : 0));
  for (const sheet of ordered) {
    for (let h = 0; h < Math.min(sheet.rows.length, 15); h += 1) {
      const map = new Map<number, ColKey>();
      const ignored: string[] = [];
      (sheet.rows[h] ?? []).forEach((cell, ci) => {
        const k = aliasMap.get(norm(cell ?? ''));
        if (k && ![...map.values()].includes(k)) map.set(ci, k);
        else if ((cell ?? '').trim()) ignored.push(cell.trim());
      });
      if (map.size < 4) continue;
      const rows: ImportRow[] = [];
      for (let r = h + 1; r < sheet.rows.length; r += 1) {
        const values = emptyValues();
        let any = false;
        map.forEach((key, ci) => {
          const v = (sheet.rows[r]?.[ci] ?? '').toString().trim();
          values[key] = v;
          if (v) any = true;
        });
        if (any) rows.push({ rowNo: r + 1, values, apply: false });
      }
      const present = new Set(map.values());
      const missing = IMPORT_COLUMNS.filter((c) => c.required !== 'no' && !present.has(c.key)).map((c) => c.key);
      return { sheetName: sheet.name, rows, missing, ignored };
    }
  }
  throw new Error('No column headers were found. Download the template and keep its header row.');
};

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export interface Issue {
  field?: ColKey;
  message: string;
}

export interface Change {
  field: ColKey;
  label: string;
  from: string;
  to: string;
  /** fill = the record has no value yet; differs = the record has another value. */
  kind: 'fill' | 'differs';
  /** Can be written to the candidate record (identity fields cannot). */
  applicable: boolean;
}

export type RowStatus = 'valid' | 'needs-photo' | 'invalid';

export interface ValidatedRow {
  row: ImportRow;
  match: 'matched' | 'unknown' | 'conflict';
  candidate?: Candidate;
  errors: Issue[];
  warnings: Issue[];
  changes: Change[];
  /** The candidate as the card will print it (record, plus sheet values the user chose to apply). */
  effective?: Candidate;
  status: RowStatus;
  activeCard?: IdCardRecord;
}

const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const normalizeBlood = (raw: string): string => {
  const s = raw.toUpperCase().replace(/\s+/g, '').replace(/POSITIVE|\+VE/g, '+').replace(/NEGATIVE|-VE/g, '-');
  return BLOOD.includes(s) ? s : '';
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Parses YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY and DD-Mon-YYYY into YYYY-MM-DD, or null when it is not a real date. */
export const parseDate = (raw: string): string | null => {
  const s = raw.trim();
  let y: number;
  let m: number;
  let d: number;
  let hit = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T ].*)?$/.exec(s);
  if (hit) [y, m, d] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s))) [d, m, y] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = /^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ,]+(\d{4})$/.exec(s))) {
    const mi = MONTHS.indexOf(hit[2].slice(0, 3).toLowerCase());
    if (mi < 0) return null;
    [d, m, y] = [Number(hit[1]), mi + 1, Number(hit[3])];
  } else return null;
  if (y < 1940 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return addDaysIso(iso, 0) === iso ? iso : null;
};

const digits = (s: string) => s.replace(/\D/g, '');
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-_/.]{1,39}$/;

/** True for text that can be used as a photograph source directly (an image URL or an embedded image). */
export const isPhotoUrl = (v: string) => /^(https?:\/\/|data:image\/)/i.test(v.trim());

const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
};

/** Validates every row against the candidate records. Pure: nothing is changed. */
export const validateRows = (rows: ImportRow[], candidates: Candidate[], activeCards: Map<string, IdCardRecord>): ValidatedRow[] => {
  const byUser = new Map(candidates.map((c) => [c.userId.toLowerCase(), c]));
  const byEmp = new Map<string, Candidate>();
  candidates.forEach((c) => {
    [employeeIdOf(c), c.oldEmployeeId, c.clientCandidateCode].filter(Boolean).forEach((id) => byEmp.set((id as string).toLowerCase(), c));
  });

  const firstRowFor = new Map<string, number>(); // candidate id (matched) or typed id -> first row number
  const today = todayIso();

  return rows.map((row) => {
    const v = row.values;
    const errors: Issue[] = [];
    const warnings: Issue[] = [];
    const changes: Change[] = [];
    const err = (message: string, field?: ColKey) => errors.push({ field, message });
    const warn = (message: string, field?: ColKey) => warnings.push({ field, message });

    /* mandatory fields */
    (['name', 'client', 'designation', 'department', 'location', 'joiningDate', 'contact', 'bloodGroup', 'emergency'] as ColKey[]).forEach((k) => {
      if (!v[k].trim()) err(`${colLabel(k)} is required`, k);
    });
    if (!v.candidateId.trim() && !v.employeeId.trim()) err('Candidate ID or Employee ID is required', 'candidateId');

    /* formats */
    if (v.candidateId.trim() && !ID_PATTERN.test(v.candidateId.trim())) err(`Candidate ID "${v.candidateId}" has invalid characters`, 'candidateId');
    if (v.employeeId.trim() && !ID_PATTERN.test(v.employeeId.trim())) err(`Employee ID "${v.employeeId}" has invalid characters`, 'employeeId');
    const doj = v.joiningDate.trim() ? parseDate(v.joiningDate) : null;
    if (v.joiningDate.trim() && !doj) err(`Joining Date "${v.joiningDate}" is not a valid date (use YYYY-MM-DD or DD-MM-YYYY)`, 'joiningDate');
    if (doj && doj > addDaysIso(today, 730)) warn('Joining Date is more than two years ahead', 'joiningDate');
    if (v.contact.trim() && (digits(v.contact).length < 10 || digits(v.contact).length > 15)) err('Contact Number must have 10 to 15 digits', 'contact');
    if (v.emergency.trim() && digits(v.emergency).length < 10) err('Emergency Contact must include a phone number (at least 10 digits)', 'emergency');
    const blood = v.bloodGroup.trim() ? normalizeBlood(v.bloodGroup) : '';
    if (v.bloodGroup.trim() && !blood) err(`Blood Group "${v.bloodGroup}" is not valid (A+, A-, B+, B-, O+, O-, AB+, AB-)`, 'bloodGroup');
    const dob = v.dob.trim() ? parseDate(v.dob) : null;
    if (v.dob.trim() && !dob) err(`Date of Birth "${v.dob}" is not a valid date`, 'dob');
    if (dob && dob > today) err('Date of Birth cannot be in the future', 'dob');

    /* matching against the existing candidate records */
    const byU = v.candidateId.trim() ? byUser.get(v.candidateId.trim().toLowerCase()) : undefined;
    const byE = v.employeeId.trim() ? byEmp.get(v.employeeId.trim().toLowerCase()) : undefined;
    let candidate: Candidate | undefined;
    let match: ValidatedRow['match'] = 'unknown';
    if (byU && byE && byU.id !== byE.id) {
      match = 'conflict';
      err(`Candidate ID ${byU.userId} (${fullName(byU)}) and Employee ID ${v.employeeId} (${fullName(byE)}) belong to different candidates`, 'candidateId');
    } else if (byU && v.employeeId.trim() && !byE) {
      candidate = byU;
      match = 'matched';
      const rec = employeeIdOf(byU);
      if (rec) warn(`Employee ID in the sheet (${v.employeeId}) differs from the record (${rec}). The record is not changed.`, 'employeeId');
      else warn(`The candidate record has no Employee ID; ${v.employeeId} from the sheet is not saved by the import.`, 'employeeId');
    } else if (byE && v.candidateId.trim() && !byU) {
      match = 'conflict';
      err(`Candidate ID "${v.candidateId}" is not in the system, but Employee ID ${v.employeeId} belongs to ${fullName(byE)} (${byE.userId}). Check the sheet.`, 'candidateId');
    } else if (byU || byE) {
      candidate = (byU ?? byE) as Candidate;
      match = 'matched';
    } else if (v.candidateId.trim() || v.employeeId.trim()) {
      err(`Unknown candidate: no record matches ${[v.candidateId && `Candidate ID ${v.candidateId}`, v.employeeId && `Employee ID ${v.employeeId}`].filter(Boolean).join(' / ')}. Candidates are not created by this import.`, v.candidateId.trim() ? 'candidateId' : 'employeeId');
    }

    /* duplicates inside the file (by resolved candidate, else by the typed ID) */
    const dupKey = candidate ? `c:${candidate.id}` : v.candidateId.trim() ? `u:${v.candidateId.trim().toLowerCase()}` : v.employeeId.trim() ? `e:${v.employeeId.trim().toLowerCase()}` : '';
    if (dupKey) {
      const first = firstRowFor.get(dupKey);
      if (first !== undefined) err(`Duplicate record: the same candidate appears on row ${first}`, v.candidateId.trim() ? 'candidateId' : 'employeeId');
      else firstRowFor.set(dupKey, row.rowNo);
    }

    /* compare with the record: never applied silently */
    const push = (field: ColKey, cur: string, next: string, same_: boolean, applicable = true) => {
      if (!next.trim() || same_) return;
      changes.push({ field, label: colLabel(field), from: cur, to: next, kind: cur.trim() ? 'differs' : 'fill', applicable });
    };
    let effective: Candidate | undefined;
    if (candidate) {
      push('name', fullName(candidate), v.name.trim(), same(fullName(candidate), v.name.replace(/\s+/g, ' ')));
      push('designation', candidate.designation, v.designation.trim(), same(candidate.designation, v.designation));
      push('department', candidate.department, v.department.trim(), same(candidate.department, v.department));
      push('location', candidate.workLocation, v.location.trim(), same(candidate.workLocation, v.location));
      push('contact', candidate.phone, v.contact.trim(), digits(candidate.phone).slice(-10) === digits(v.contact).slice(-10));
      if (blood) push('bloodGroup', candidate.bloodGroup ?? '', blood, same(candidate.bloodGroup ?? '', blood));
      push('emergency', candidate.emergencyContact ?? '', v.emergency.trim(), same(candidate.emergencyContact ?? '', v.emergency));
      if (doj) push('joiningDate', candidate.dateOfJoining, doj, candidate.dateOfJoining === doj);
      if (dob) push('dob', candidate.dob ?? '', dob, (candidate.dob ?? '') === dob);
      if (v.client.trim() && !same(candidate.clientName, v.client)) {
        warn(`Client in the sheet (${v.client}) differs from the record (${candidate.clientName}). The client is never changed by an import.`, 'client');
      }

      // Candidate as printed: the record, plus sheet values only where the user ticked "Update candidate record".
      const patch: Partial<Candidate> = {};
      if (row.apply) {
        changes.filter((c) => c.applicable).forEach((c) => {
          if (c.field === 'name') Object.assign(patch, splitName(v.name));
          if (c.field === 'designation') patch.designation = v.designation.trim();
          if (c.field === 'department') patch.department = v.department.trim();
          if (c.field === 'location') patch.workLocation = v.location.trim();
          if (c.field === 'contact') patch.phone = v.contact.trim();
          if (c.field === 'bloodGroup') patch.bloodGroup = blood;
          if (c.field === 'emergency') patch.emergencyContact = v.emergency.trim();
          if (c.field === 'joiningDate' && doj) patch.dateOfJoining = doj;
          if (c.field === 'dob' && dob) patch.dob = dob;
        });
      }
      // Photograph: a photo uploaded / mapped here fills a missing one; replacing an existing one needs the explicit tick.
      const sheetPhoto = row.photoData || (isPhotoUrl(v.photo) ? v.photo.trim() : '');
      if (sheetPhoto) {
        if (!candidate.avatarUrl) patch.avatarUrl = sheetPhoto;
        else if (candidate.avatarUrl !== sheetPhoto) {
          changes.push({ field: 'photo', label: 'Photo', from: 'current photograph', to: 'new photograph', kind: 'differs', applicable: true });
          if (row.apply) patch.avatarUrl = sheetPhoto;
        }
      }
      effective = { ...candidate, ...patch };

      /* mandatory data still missing on the card? */
      const issues = idCardIssues(effective);
      issues.forEach((i) => {
        if (i === 'Photograph') return;
        const fillable = changes.find((c) => c.kind === 'fill' && c.applicable && colLabel(c.field).toLowerCase().startsWith(i.toLowerCase().split(' ')[0]));
        if (fillable && !row.apply) err(`The candidate record has no ${i}. The sheet provides it: tick "Update candidate record" to use it.`);
        else err(`The candidate record has no ${i}.`);
      });

      const active = activeCards.get(candidate.id);
      if (active) warn(`Already has an active ID card (${active.cardNo}). It is skipped unless you choose to reissue.`);
    }

    const needsPhoto = Boolean(effective) && !effective?.avatarUrl;
    if (needsPhoto) {
      const named = v.photo.trim() && !isPhotoUrl(v.photo) ? ` (file "${v.photo.trim()}" not mapped yet)` : '';
      warn(`Photograph missing${named}. Map the photo file or upload one for this row.`, 'photo');
    }

    const status: RowStatus = errors.length > 0 ? 'invalid' : needsPhoto ? 'needs-photo' : 'valid';
    return { row, match, candidate, errors, warnings, changes, effective, status, activeCard: candidate ? activeCards.get(candidate.id) : undefined };
  });
};

/** Row -> mapped photo by file name (with or without extension) or by an ID-named file. */
export const photoKeyMatches = (fileName: string, row: ImportRow): boolean => {
  const base = fileName.replace(/\.[^.]+$/, '').toLowerCase();
  const full = fileName.toLowerCase();
  const photoCol = row.values.photo.trim().toLowerCase();
  const photoBase = photoCol.replace(/\.[^.]+$/, '');
  return Boolean(
    (photoCol && (photoCol === full || photoBase === base)) ||
      (row.values.candidateId.trim() && row.values.candidateId.trim().toLowerCase() === base) ||
      (row.values.employeeId.trim() && row.values.employeeId.trim().toLowerCase() === base)
  );
};
