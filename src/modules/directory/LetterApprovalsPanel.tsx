import React, { useMemo, useState } from 'react';
import { X, Check, XCircle, Eye, Search, AlertCircle } from 'lucide-react';
import { MOCK_CANDIDATES } from '../../data/mockOnboardingData';
import {
  LETTER_APPROVALS,
  LETTER_TEMPLATES,
  formatLetterDate,
  type LetterApproval,
} from '../../data/mockLetterBuilderData';
import { useSignatures } from '../../data/mockSignatureData';
import { useSignatureEnabledMap } from '../hr-ops/clientFeatureStore';
import { logAudit, useAuditLog, formatAuditTime } from '../hr-ops/auditStore';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { SectionCard } from '../../components/page/SectionCard';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import { LetterDocument } from './SignatureUploadPanel';

const STATUS_TONE: Record<LetterApproval['status'], string> = {
  'Awaiting employee approval': 'tone-warn',
  Approved: 'tone-good',
  Rejected: 'tone-bad',
  Expired: 'tone-muted',
};
const TYPE_TEMPLATE: Record<LetterApproval['type'], string> = { Offer: 'tpl-offer', Extension: 'tpl-extension', Hike: 'tpl-hike' };

export const LetterApprovalsPanel: React.FC = () => {
  const access = useFeatureAccess('signature-upload');
  const { actor } = useRole();
  const readOnly = access !== 'manage';
  const { message, showToast } = useToast(3500);
  const signatures = useSignatures();
  const enabledMap = useSignatureEnabledMap();
  const audit = useAuditLog({ area: 'signature-upload' });

  const [rows, setRows] = useState<LetterApproval[]>(LETTER_APPROVALS);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const candOf = (r: LetterApproval) => MOCK_CANDIDATES.find((c) => c.id === r.candidateId);
  const nameOf = (r: LetterApproval) => {
    const c = candOf(r);
    return c ? `${c.firstName} ${c.lastName}` : r.candidateId;
  };

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (typeFilter && r.type !== typeFilter) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        const c = MOCK_CANDIDATES.find((x) => x.id === r.candidateId);
        const hay = `${c?.firstName ?? ''} ${c?.lastName ?? ''} ${c?.clientName ?? ''} ${r.id}`.toLowerCase();
        return !query.trim() || hay.includes(query.trim().toLowerCase());
      }),
    [rows, typeFilter, statusFilter, query]
  );

  const open = rows.find((r) => r.id === openId) ?? null;
  const openCand = open ? candOf(open) : undefined;
  const openSig = open ? signatures[open.candidateId] : undefined;
  const openEnabled = openCand ? Boolean(enabledMap[openCand.clientName]) : false;

  const decide = (decision: 'Approved' | 'Rejected') => {
    if (!open || !openCand || readOnly || open.status !== 'Awaiting employee approval') return;
    if (decision === 'Approved' && openEnabled && !openSig) {
      setDrawerError(`${nameOf(open)} has no signature on file. Upload it first in the Candidate 360 profile, Signature section.`);
      return;
    }
    setDrawerError(null);
    const applied = decision === 'Approved' && openEnabled && Boolean(openSig);
    setRows((prev) =>
      prev.map((r) =>
        r.id === open.id
          ? { ...r, status: decision, approvedAt: decision === 'Approved' ? new Date().toISOString() : undefined, signatureApplied: applied }
          : r
      )
    );
    logAudit({
      area: 'signature-upload',
      action: `${decision === 'Approved' ? 'Approved' : 'Rejected'} ${open.type} letter ${open.id} as employee ${nameOf(open)}${applied ? ' (signature applied)' : ''}`,
      subjectId: open.candidateId,
      actorId: actor.id,
      actorName: actor.name,
    });
    showToast(`${open.type} letter ${decision.toLowerCase()} for ${nameOf(open)}`);
  };

  const closeDrawer = () => {
    setOpenId(null);
    setDrawerError(null);
  };

  const template = open ? LETTER_TEMPLATES.find((t) => t.id === TYPE_TEMPLATE[open.type]) : undefined;

  return (
    <div className="cc-stack">
      <Toast message={message} variant="solid" accent="purple" />
      {readOnly && <p className="cc-muted text-xs">View only: your role cannot approve or reject on behalf of employees.</p>}

      <SectionCard title="Employee letter approvals" subtitle="Offer, Extension and Hike letters awaiting the employee's acceptance">
        <div className="grid gap-2 mb-3 sm:grid-cols-[minmax(0,1fr)_11rem_14rem]">
          <div className="relative min-w-0">
            <Search className="w-3.5 h-3.5 cc-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              className="cc-input w-full" style={{ paddingLeft: 32 }}
              placeholder="Search employee, client or letter ID"
              aria-label="Search letters"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <SelectMenu value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="cc-input w-full" aria-label="Letter type">
            <option value="">All letter types</option>
            <option value="Offer">Offer</option>
            <option value="Extension">Extension</option>
            <option value="Hike">Hike</option>
          </SelectMenu>
          <SelectMenu value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="cc-input w-full" aria-label="Status">
            <option value="">All statuses</option>
            {(Object.keys(STATUS_TONE) as LetterApproval['status'][]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </SelectMenu>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="cc-muted text-left">
                <th className="py-2 pr-3 font-semibold">Employee</th>
                <th className="py-2 pr-3 font-semibold">Letter</th>
                <th className="py-2 pr-3 font-semibold">Issued</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold">Approved at</th>
                <th className="py-2 pr-3 font-semibold">Signature applied</th>
                <th className="py-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="cc-divide">
              {filtered.map((r) => (
                <tr key={r.id} className="cc-row">
                  <td className="py-2 pr-3">
                    <div className="cc-title font-semibold">{nameOf(r)}</div>
                    <div className="cc-muted text-[11px]">{candOf(r)?.clientName}</div>
                  </td>
                  <td className="py-2 pr-3 cc-title">{r.type} <span className="cc-muted">({r.id})</span></td>
                  <td className="py-2 pr-3 cc-title">{formatLetterDate(r.issuedOn)}</td>
                  <td className="py-2 pr-3"><span className={cn(STATUS_TONE[r.status], 'tone-chip px-2 py-0.5 rounded-full whitespace-nowrap')}>{r.status}</span></td>
                  <td className="py-2 pr-3 cc-title">{r.approvedAt ? formatAuditTime(r.approvedAt) : '-'}</td>
                  <td className="py-2 pr-3 cc-title">{r.signatureApplied ? 'Yes' : 'No'}</td>
                  <td className="py-2 text-right">
                    <button type="button" className="cc-btn cc-btn-secondary" onClick={() => { setOpenId(r.id); setDrawerError(null); }}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center cc-muted">No letters match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Approval activity" subtitle="Employee approvals and rejections (signature-upload)">
        {audit.length === 0 ? (
          <p className="cc-muted text-xs">No approvals yet in this session. Open a letter and approve it as the employee.</p>
        ) : (
          <ul className="cc-divide">
            {audit.slice(0, 6).map((e) => (
              <li key={e.id} className="cc-row py-2 text-xs flex flex-wrap justify-between gap-x-3">
                <span className="cc-title">{e.action}</span>
                <span className="cc-muted">{e.actorName}, {formatAuditTime(e.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {open && openCand && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60" onClick={closeDrawer}>
          <aside
            role="dialog"
            aria-label="Letter details"
            className="cc-card h-full w-full max-w-lg overflow-y-auto p-4 sm:p-5 space-y-4 rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="cc-title text-base font-bold">{open.type} letter, {nameOf(open)}</h2>
                <p className="cc-muted text-xs">{open.id} · {openCand.clientName} · issued {formatLetterDate(open.issuedOn)}</p>
              </div>
              <button type="button" aria-label="Close" className="cc-btn cc-btn-secondary" onClick={closeDrawer}><X className="w-4 h-4" /></button>
            </header>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={cn(STATUS_TONE[open.status], 'tone-chip px-2 py-0.5 rounded-full')}>{open.status}</span>
              {open.approvedAt && <span className="cc-muted">Approved {formatAuditTime(open.approvedAt)}</span>}
              <span className="cc-muted">Signature feature: {openEnabled ? 'enabled' : 'not enabled'} · on file: {openSig ? 'yes' : 'no'}</span>
            </div>

            {template && (
              <LetterDocument
                title={template.name}
                body={template.body}
                candidate={openCand}
                signatureUrl={open.status === 'Approved' && open.signatureApplied ? openSig?.imageUrl : undefined}
                signatureNote={
                  open.status === 'Approved'
                    ? 'Approved without a signature (feature not enabled for this client).'
                    : 'The employee signature is applied here once they approve the letter.'
                }
              />
            )}

            {drawerError && (
              <p role="alert" className="tone-bad tone-text text-xs flex gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{drawerError}</p>
            )}

            {open.status === 'Awaiting employee approval' ? (
              <div className="flex flex-wrap gap-2">
                <button type="button" className="cc-btn cc-btn-primary" disabled={readOnly} onClick={() => decide('Approved')}>
                  <Check className="w-3.5 h-3.5" /> Approve as employee
                </button>
                <button type="button" className="cc-btn cc-btn-secondary" disabled={readOnly} onClick={() => decide('Rejected')}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            ) : (
              <p className="cc-muted text-xs">This letter is {open.status.toLowerCase()}; no further action is available.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
