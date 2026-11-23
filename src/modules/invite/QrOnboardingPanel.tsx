import React, { useMemo, useState } from 'react';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Ban,
  ScanLine,
  Lock,
  Info,
  Send,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { CLIENT_LIST } from '../../data/mockOnboardingData';
import {
  SEED_QR_CODES,
  SEED_QR_SUBMISSIONS,
  buildQrCode,
  buildQrLink,
  clientPrefix,
  type QrCodeRecord,
  type QrStatus,
  type QrSubmission,
} from '../../data/mockQrOnboardingData';
import { Candidate } from '../../types/onboarding';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { Chip } from '../dashboard/command-center/shared';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { logAudit } from '../hr-ops/auditStore';
import { downloadBlob, downloadText } from '../../utils/download';
import type { Tone } from '../dashboard/command-center/types';

interface QrOnboardingPanelProps {
  onCandidateAdded: (newCandidate: Partial<Candidate>) => Candidate | void;
  sourcingChannels: string[];
}

/* ------------------------------------------------------------------ */
/* Deterministic QR-style matrix (finder squares, timing lines,        */
/* alignment pattern + payload-seeded data modules). Visual only.      */
/* ------------------------------------------------------------------ */
const QR_SIZE = 29;

const hashSeed = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const prng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const buildQrMatrix = (payload: string): boolean[][] => {
  const n = QR_SIZE;
  const m: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const reserved: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const rand = prng(hashSeed(payload));

  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        reserved[rr][cc] = true;
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const ring = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[rr][cc] = inside && (ring || core);
      }
    }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);

  for (let i = 8; i < n - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  const ac = n - 9;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      reserved[ac + r][ac + c] = true;
      m[ac + r][ac + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
    }
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!reserved[r][c]) m[r][c] = rand() > 0.5;
    }
  }
  return m;
};

const QUIET = 2;

const matrixToPath = (matrix: boolean[][]): string => {
  let d = '';
  matrix.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`;
    })
  );
  return d;
};

const QrSvg: React.FC<{ payload: string; className?: string }> = ({ payload, className }) => {
  const matrix = useMemo(() => buildQrMatrix(payload), [payload]);
  const d = useMemo(() => matrixToPath(matrix), [matrix]);
  const total = QR_SIZE + QUIET * 2;
  return (
    <svg viewBox={`0 0 ${total} ${total}`} className={className} role="img" aria-label={`QR code ${payload}`} shapeRendering="crispEdges">
      <rect width={total} height={total} fill="#ffffff" />
      <path d={d} fill="#0f172a" />
    </svg>
  );
};

const svgMarkup = (payload: string): string => {
  const matrix = buildQrMatrix(payload);
  const total = QR_SIZE + QUIET * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="512" height="512" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#fff"/><path d="${matrixToPath(matrix)}" fill="#0f172a"/></svg>`;
};

const downloadPng = (payload: string, fileName: string) => {
  const matrix = buildQrMatrix(payload);
  const scale = 12;
  const total = QR_SIZE + QUIET * 2;
  const canvas = document.createElement('canvas');
  canvas.width = total * scale;
  canvas.height = total * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f172a';
  matrix.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) ctx.fillRect((c + QUIET) * scale, (r + QUIET) * scale, scale, scale);
    })
  );
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, fileName);
  }, 'image/png');
};

const printQr = (record: QrCodeRecord) => {
  const w = window.open('', '_blank', 'width=480,height=640');
  if (!w) return false;
  w.document.write(
    `<html><head><title>${record.code}</title></head><body style="font-family:Arial,sans-serif;text-align:center;padding:24px">` +
      `<h2 style="margin:0 0 4px">${record.clientName}</h2><p style="margin:0 0 16px;color:#475569">Scan to start your onboarding</p>` +
      `<div style="width:320px;margin:0 auto">${svgMarkup(record.link).replace('width="512" height="512"', 'width="320" height="320"')}</div>` +
      `<p style="font-family:monospace;font-size:16px;margin:16px 0 4px">${record.code}</p>` +
      `<p style="color:#64748b;font-size:12px">Valid until ${record.expiresOn}</p></body></html>`
  );
  w.document.close();
  w.focus();
  w.print();
  return true;
};

/* ------------------------------------------------------------------ */

const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const effectiveStatus = (q: QrCodeRecord): QrStatus =>
  q.status === 'Active' && q.expiresOn < DASHBOARD_REFERENCE_DATE ? 'Expired' : q.status;

const STATUS_TONE: Record<QrStatus, Tone> = { Active: 'good', Expired: 'warn', Revoked: 'bad' };

const SCAN_NAMES: [string, string][] = [
  ['Nikhil', 'Rao'],
  ['Divya', 'Pillai'],
  ['Imran', 'Shaikh'],
  ['Tanvi', 'Joshi'],
  ['Harsh', 'Vora'],
];

export const QrOnboardingPanel: React.FC<QrOnboardingPanelProps> = ({ onCandidateAdded, sourcingChannels }) => {
  const access = useFeatureAccess('qr-onboarding');
  const { actor } = useRole();
  const canManage = access === 'manage';
  const { message, showToast } = useToast();

  // Same field set as the Send Invite form (client, placement details, source)
  const [clientName, setClientName] = useState<string>(CLIENT_LIST[0]);
  const [designation, setDesignation] = useState('Senior Frontend Engineer');
  const [workLocation, setWorkLocation] = useState('Bangalore - Whitefield');
  const [recruiterName, setRecruiterName] = useState('Ananya Mukherjee');
  const [source, setSource] = useState(sourcingChannels[0] ?? 'Naukri.com');
  // QR settings
  const [expiresOn, setExpiresOn] = useState(addDays(DASHBOARD_REFERENCE_DATE, 30));
  const [usageLimit, setUsageLimit] = useState('100');
  const [touched, setTouched] = useState(false);

  const [codes, setCodes] = useState<QrCodeRecord[]>(SEED_QR_CODES);
  const [submissions, setSubmissions] = useState<QrSubmission[]>(SEED_QR_SUBMISSIONS);
  const [pushed, setPushed] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string>(SEED_QR_CODES[0].id);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const errors: Record<string, string> = {};
  if (!clientName.trim()) errors.clientName = 'Client Organization is required';
  if (!source.trim()) errors.source = 'Source is required';
  if (!expiresOn) errors.expiresOn = 'Expiry date is required';
  else if (expiresOn < DASHBOARD_REFERENCE_DATE) errors.expiresOn = 'Expiry cannot be in the past';
  const limitNum = Number(usageLimit);
  if (!usageLimit.trim()) errors.usageLimit = 'Usage limit is required';
  else if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 5000) errors.usageLimit = 'Enter a whole number between 1 and 5000';

  const selected = codes.find((c) => c.id === selectedId) ?? codes[0];
  const nextSeq = useMemo(() => {
    const prefix = `QR-${clientPrefix(clientName)}-`;
    const used = codes.filter((c) => c.code.startsWith(prefix)).map((c) => Number(c.code.split('-').pop()) || 0);
    return (used.length ? Math.max(...used) : 0) + 1;
  }, [codes, clientName]);
  const previewCode = buildQrCode(clientName, nextSeq);

  const clientsWithCodes = useMemo(() => Array.from(new Set(codes.map((c) => c.clientName))), [codes]);
  const visibleCodes = clientFilter === 'all' ? codes : codes.filter((c) => c.clientName === clientFilter);
  const activeByClient = useMemo(() => {
    const map: Record<string, number> = {};
    codes.forEach((c) => {
      if (effectiveStatus(c) === 'Active') map[c.clientName] = (map[c.clientName] ?? 0) + 1;
    });
    return map;
  }, [codes]);

  const handleGenerate = () => {
    setTouched(true);
    if (!canManage || Object.keys(errors).length) return;
    const code = buildQrCode(clientName, nextSeq);
    const record: QrCodeRecord = {
      id: `QR-${Date.now()}`,
      clientName,
      code,
      link: buildQrLink(code),
      createdBy: actor.name,
      createdAt: DASHBOARD_REFERENCE_DATE,
      expiresOn,
      usageLimit: limitNum,
      scans: 0,
      submissions: 0,
      status: 'Active',
      designation: designation.trim() || 'Executive Trainee',
      workLocation: workLocation.trim() || 'Bangalore',
      recruiterName: recruiterName.trim() || 'Ananya Mukherjee',
      source,
    };
    setCodes((prev) => [record, ...prev]);
    setSelectedId(record.id);
    setClientFilter('all');
    setTouched(false);
    logAudit({ area: 'qr-onboarding', action: `Generated QR ${code}`, subjectId: code, actorId: actor.id, actorName: actor.name });
    showToast(`QR code ${code} generated for ${clientName}.`);
  };

  const handleRevoke = (q: QrCodeRecord) => {
    if (!canManage) return;
    setCodes((prev) => prev.map((c) => (c.id === q.id ? { ...c, status: 'Revoked' } : c)));
    logAudit({ area: 'qr-onboarding', action: `Revoked QR ${q.code}`, subjectId: q.code, actorId: actor.id, actorName: actor.name });
    showToast(`QR code ${q.code} revoked. New scans are blocked.`);
  };

  const handleCopy = async (q: QrCodeRecord) => {
    try {
      await navigator.clipboard.writeText(q.link);
    } catch {
      /* clipboard may be unavailable; still confirm in UI */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('QR onboarding link copied.');
  };

  const handleSimulateScan = (q: QrCodeRecord) => {
    if (!canManage) return;
    const status = effectiveStatus(q);
    if (status !== 'Active') {
      showToast(`Scan blocked: code is ${status.toLowerCase()}.`);
      return;
    }
    if (q.submissions >= q.usageLimit) {
      showToast('Scan blocked: usage limit reached.');
      return;
    }
    const [fn, ln] = SCAN_NAMES[(q.scans + q.submissions) % SCAN_NAMES.length];
    const sub: QrSubmission = {
      id: `QS-${Date.now()}`,
      qrCode: q.code,
      clientName: q.clientName,
      firstName: fn,
      lastName: ln,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
      phone: `+91 9${String(Math.floor(100000000 + Math.random() * 899999999))}`,
      emergencyContact: `+91 9${String(Math.floor(100000000 + Math.random() * 899999999))}`,
      submittedAt: `${DASHBOARD_REFERENCE_DATE} 05:30 PM`,
      designation: q.designation,
      workLocation: q.workLocation,
      recruiterName: q.recruiterName,
      source: q.source,
    };
    setSubmissions((prev) => [sub, ...prev]);
    setCodes((prev) => prev.map((c) => (c.id === q.id ? { ...c, scans: c.scans + 1, submissions: c.submissions + 1 } : c)));
    showToast(`Simulated scan: ${fn} ${ln} submitted the onboarding form.`);
  };

  const handlePush = (s: QrSubmission) => {
    if (!canManage || pushed.has(s.id)) return;
    const data: Partial<Candidate> = {
      id: `cand-${Date.now()}`,
      userId: `2C-2026-${Math.floor(8950 + Math.random() * 50)}`,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      whatsappNumber: s.phone,
      emergencyContact: s.emergencyContact,
      clientName: s.clientName,
      designation: s.designation,
      workLocation: s.workLocation,
      source: s.source as any,
      recruiterName: s.recruiterName,
      dateOfJoining: '2026-10-15',
      dateOfInterview: '2026-09-22',
      joiningStatus: 'Yet to Join',
      overallKycStatus: 'Not Started',
      pennyTestStatus: 'Not Sent',
      onboardingCompletionPct: 15,
      kycRecords: [],
      documents: [],
      letters: [],
      missingFields: ['Aadhaar', 'PAN', 'Bank Account', 'Signed Offer'],
    };
    onCandidateAdded(data);
    setPushed((prev) => new Set(prev).add(s.id));
    logAudit({ area: 'qr-onboarding', action: `Pushed QR submission ${s.firstName} ${s.lastName} to candidate table`, subjectId: s.qrCode, actorId: actor.id, actorName: actor.name });
    showToast(`${s.firstName} ${s.lastName} added to the main candidate table.`);
  };

  const fieldError = (key: string) =>
    touched && errors[key] ? <p className="text-[11px] mt-1 font-medium tone-bad tone-text">{errors[key]}</p> : null;

  return (
    <div className="space-y-5 text-xs">
      <Toast message={message} />

      {!canManage && (
        <div className="cc-callout tone-info">
          <Lock className="w-4 h-4 tone-text shrink-0 mt-0.5" />
          <span>
            <strong>View only.</strong> Your role can see QR codes and submissions but cannot generate, revoke or push them.
          </span>
        </div>
      )}

      <div className="cc-callout tone-info">
        <Info className="w-4 h-4 tone-text shrink-0 mt-0.5" />
        <span>
          <strong>How QR data reaches the main data table:</strong> the candidate scans the client QR, fills the same contact form used for invites,
          and the entry lands in <em>Submissions via QR</em> below. HR reviews it and clicks <em>Push to candidate table</em>, which creates the
          candidate record (Yet to Join, KYC not started) in the main Candidates list.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form: same fields as Send Invite */}
        <div className="cc-card p-4 space-y-3.5 lg:col-span-3 min-w-0">
          <div>
            <h3 className="cc-title text-sm font-bold">Generate Client QR Code</h3>
            <p className="cc-muted text-[11px] mt-0.5">
              Same client and placement fields as Send Invite. Candidates fill their own contact details after scanning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="cc-label" htmlFor="qr-client">
                Client Organization <span className="text-rose-500">*</span>
              </label>
              <SelectMenu id="qr-client" value={clientName} onChange={(e) => setClientName(e.target.value)} className="cc-input" disabled={!canManage}>
                {CLIENT_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </SelectMenu>
              {fieldError('clientName')}
              <p className="cc-hint">
                Client code prefix <span className="font-mono font-semibold">{clientPrefix(clientName)}</span> · next code{' '}
                <span className="font-mono font-semibold">{previewCode}</span> · {activeByClient[clientName] ?? 0} active QR code(s)
              </p>
            </div>

            <div>
              <label className="cc-label" htmlFor="qr-designation">Designation / Role Title <span className="cc-muted font-normal">(Optional)</span></label>
              <input id="qr-designation" className="cc-input" value={designation} onChange={(e) => setDesignation(e.target.value)} disabled={!canManage} placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div>
              <label className="cc-label" htmlFor="qr-location">Work Location <span className="cc-muted font-normal">(Optional)</span></label>
              <input id="qr-location" className="cc-input" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} disabled={!canManage} placeholder="e.g. Bangalore - Whitefield" />
            </div>
            <div>
              <label className="cc-label" htmlFor="qr-recruiter">Assigned Recruiter <span className="cc-muted font-normal">(Optional)</span></label>
              <input id="qr-recruiter" className="cc-input" value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} disabled={!canManage} placeholder="e.g. Ananya Mukherjee" />
            </div>
            <div>
              <label className="cc-label" htmlFor="qr-source">
                Source <span className="text-rose-500">*</span>
              </label>
              <SelectMenu id="qr-source" value={source} onChange={(e) => setSource(e.target.value)} className="cc-input" disabled={!canManage}>
                {sourcingChannels.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </SelectMenu>
              {fieldError('source')}
            </div>

            <div>
              <label className="cc-label" htmlFor="qr-expiry">
                Expiry Date <span className="text-rose-500">*</span>
              </label>
              <input id="qr-expiry" type="date" className="cc-input" value={expiresOn} min={DASHBOARD_REFERENCE_DATE} onChange={(e) => setExpiresOn(e.target.value)} disabled={!canManage} />
              {fieldError('expiresOn')}
            </div>
            <div>
              <label className="cc-label" htmlFor="qr-limit">
                Usage Limit (submissions) <span className="text-rose-500">*</span>
              </label>
              <input id="qr-limit" inputMode="numeric" className="cc-input" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value.replace(/\D/g, ''))} disabled={!canManage} placeholder="e.g. 100" />
              {fieldError('usageLimit')}
            </div>
          </div>

          <div className="cc-callout tone-muted">
            <ScanLine className="w-4 h-4 tone-text shrink-0 mt-0.5" />
            <span>
              Candidate fills after scanning: First Name, Last Name, Email, Contact, WhatsApp and Emergency Contact (same validation as the invite form).
            </span>
          </div>

          <div className="flex justify-end">
            <button type="button" className="cc-btn cc-btn-primary" onClick={handleGenerate} disabled={!canManage}>
              <QrCode className="w-3.5 h-3.5" />
              <span>Generate QR Code</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="cc-card p-4 lg:col-span-2 min-w-0 flex flex-col items-center gap-3 text-center">
          {selected ? (
            <>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <h3 className="cc-title text-sm font-bold">{selected.clientName}</h3>
                <Chip tone={STATUS_TONE[effectiveStatus(selected)]}>{effectiveStatus(selected)}</Chip>
              </div>
              <div className="w-44 sm:w-52 rounded-xl overflow-hidden border border-[color:var(--cc-card-border)] bg-white p-1">
                <QrSvg payload={selected.link} className="w-full h-auto" />
              </div>
              <p className="font-mono text-sm font-bold cc-title">{selected.code}</p>
              <p className="cc-muted text-[11px]">
                Expires {selected.expiresOn} · {selected.submissions}/{selected.usageLimit} submissions used · {selected.scans} scans
              </p>
              <div className="w-full cc-track h-1.5 rounded-full overflow-hidden tone-info">
                <div className="tone-fill h-full" style={{ width: `${Math.min(100, (selected.submissions / selected.usageLimit) * 100)}%` }} />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" className="cc-btn cc-btn-secondary" onClick={() => downloadPng(selected.link, `${selected.code}.png`)}>
                  <ImageIcon className="w-3.5 h-3.5" /><span>PNG</span>
                </button>
                <button type="button" className="cc-btn cc-btn-secondary" onClick={() => downloadText(svgMarkup(selected.link), `${selected.code}.svg`, 'image/svg+xml;charset=utf-8;')}>
                  <Download className="w-3.5 h-3.5" /><span>SVG</span>
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn-secondary"
                  onClick={() => {
                    if (!printQr(selected)) showToast('Pop-up blocked: allow pop-ups to print the QR.');
                  }}
                >
                  <Printer className="w-3.5 h-3.5" /><span>Print</span>
                </button>
                <button type="button" className="cc-btn cc-btn-secondary" onClick={() => handleCopy(selected)}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}<span>{copied ? 'Copied' : 'Copy link'}</span>
                </button>
              </div>
              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => handleSimulateScan(selected)} disabled={!canManage}>
                <ScanLine className="w-3.5 h-3.5" /><span>Simulate candidate scan</span>
              </button>
              <p className="cc-muted text-[10px] font-mono break-all">{selected.link}</p>
            </>
          ) : (
            <p className="cc-muted py-10">Generate a QR code to preview it here.</p>
          )}
        </div>
      </div>

      {/* Generated QR codes */}
      <div className="cc-card p-4 space-y-3 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="cc-title text-sm font-bold">Generated QR Codes</h3>
            <p className="cc-muted text-[11px]">Client-wise codes with scan and submission counts.</p>
          </div>
          <div className="w-full sm:w-56">
            <SelectMenu value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="cc-input" aria-label="Filter by client">
              <option value="all">All clients ({codes.length})</option>
              {clientsWithCodes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectMenu>
          </div>
        </div>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Code</th>
                <th>Created by / at</th>
                <th>Expires</th>
                <th className="text-right">Scans</th>
                <th className="text-right">Submissions</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleCodes.map((q) => {
                const st = effectiveStatus(q);
                return (
                  <tr key={q.id} className={q.id === selectedId ? 'bg-[color:var(--cc-row-hover)]' : ''}>
                    <td className="font-semibold cc-title min-w-[120px]">{q.clientName}</td>
                    <td className="font-mono whitespace-nowrap">{q.code}</td>
                    <td className="whitespace-nowrap">
                      {q.createdBy}
                      <span className="cc-muted block text-[11px]">{q.createdAt}</span>
                    </td>
                    <td className="whitespace-nowrap font-mono">{q.expiresOn}</td>
                    <td className="text-right tabular-nums">{q.scans}</td>
                    <td className="text-right tabular-nums">{q.submissions}/{q.usageLimit}</td>
                    <td><Chip tone={STATUS_TONE[st]}>{st}</Chip></td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" className="cc-btn cc-btn-secondary" style={{ height: 28, padding: '0 8px' }} onClick={() => setSelectedId(q.id)} aria-label={`View ${q.code}`} title="View QR">
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="cc-btn cc-btn-tone tone-bad"
                          style={{ height: 28 }}
                          onClick={() => handleRevoke(q)}
                          disabled={!canManage || st !== 'Active'}
                          title={canManage ? 'Revoke this QR code' : 'View only'}
                        >
                          <Ban className="w-3.5 h-3.5" /><span>Revoke</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submissions via QR */}
      <div className="cc-card p-4 space-y-3 min-w-0">
        <div>
          <h3 className="cc-title text-sm font-bold">Submissions via QR</h3>
          <p className="cc-muted text-[11px]">
            {submissions.length - pushed.size} awaiting review · {pushed.size} pushed this session
          </p>
        </div>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Contact</th>
                <th>Client / QR</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const done = pushed.has(s.id);
                return (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap">
                      <span className="font-semibold cc-title">{s.firstName} {s.lastName}</span>
                      <span className="cc-muted block text-[11px] font-mono">{s.submittedAt}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      {s.email}
                      <span className="cc-muted block text-[11px] font-mono">{s.phone}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      {s.clientName}
                      <span className="cc-muted block text-[11px] font-mono">{s.qrCode}</span>
                    </td>
                    <td className="text-right">
                      {done ? (
                        <Chip tone="good">Pushed to candidate table</Chip>
                      ) : (
                        <button
                          type="button"
                          className="cc-btn cc-btn-primary"
                          style={{ height: 28 }}
                          onClick={() => handlePush(s)}
                          disabled={!canManage}
                          title={canManage ? undefined : 'View only'}
                        >
                          <Send className="w-3.5 h-3.5" /><span>Push to candidate table</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {submissions.length === 0 && (
            <p className="cc-muted text-center py-6 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> No QR submissions yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
