import React, { useMemo, useState } from 'react';
import { CalendarClock, DoorOpen, FileX2, Hourglass, Link2, Plus, Search, Upload, UserMinus } from 'lucide-react';
import { KpiCard } from '../../components/page/KpiCard';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { SectionCard, Chip } from '../dashboard/command-center/shared';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { logAudit, useAuditLog, formatAuditTime } from '../hr-ops/auditStore';
import type { Candidate } from '../../types/onboarding';
import { EXIT_STATUSES, EXIT_TODAY, EXIT_TYPES, addDays, formatExitDate } from '../../data/mockExitData';
import { useExitStore, toggleRule } from './exits/exitStore';
import { STATUS_TONE, TRANSFER_TONE, ViewOnlyNote } from './exits/ExitUi';
import { InitiateExitDialog } from './exits/InitiateExitDialog';
import { OnroDialog } from './exits/OnroDialog';
import { LwdBulkDialog } from './exits/LwdBulkDialog';
import { ExitCaseDrawer } from './exits/ExitCaseDrawer';

type Dialog = 'initiate' | 'onro' | 'lwd' | null;

export const ExitsTab: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const { actor } = useRole();
  const canExit = useFeatureAccess('exit-module') === 'manage';
  const canElig = useFeatureAccess('exit-eligibility') === 'manage';
  const showExit = useFeatureAccess('exit-module') !== 'none';
  const showElig = useFeatureAccess('exit-eligibility') !== 'none';
  const { cases, rules } = useExitStore();
  const { message, showToast, hideToast } = useToast();
  const activity = useAuditLog().filter((a) => a.area === 'exit-module' || a.area === 'exit-eligibility');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [client, setClient] = useState('all');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const clients = useMemo(() => Array.from(new Set(cases.map((c) => c.client))).sort(), [cases]);
  const rows = useMemo(
    () =>
      cases.filter(
        (c) =>
          (status === 'all' || c.status === status) &&
          (type === 'all' || c.exitType === type) &&
          (client === 'all' || c.client === client) &&
          (!q.trim() || `${c.employee} ${c.empCode} ${c.id}`.toLowerCase().includes(q.trim().toLowerCase()))
      ),
    [cases, q, status, type, client]
  );

  const open = cases.filter((c) => c.status !== 'Closed');
  const in30 = open.filter((c) => c.lwd && c.lwd >= EXIT_TODAY && c.lwd <= addDays(EXIT_TODAY, 30)).length;
  const awaitingTransfer = open.filter((c) => c.transfer === 'Pending transfer closure').length;
  const onro = cases.filter((c) => c.exitType === 'Offer Not Rolled Out').length;

  const kd = useKpiDetail<'open' | 'notice' | 'transfer' | 'lwd' | 'onro'>();
  const kdTitles = { open: 'Open exit cases', notice: 'In notice period', transfer: 'Awaiting transfer clearance', lwd: 'LWD in next 30 days', onro: 'Offer Not Rolled Out' } as const;
  const kdCases = (id: keyof typeof kdTitles) =>
    id === 'open' ? open
    : id === 'notice' ? cases.filter((c) => c.status === 'Notice period')
    : id === 'transfer' ? open.filter((c) => c.transfer === 'Pending transfer closure')
    : id === 'lwd' ? open.filter((c) => c.lwd && c.lwd >= EXIT_TODAY && c.lwd <= addDays(EXIT_TODAY, 30))
    : cases.filter((c) => c.exitType === 'Offer Not Rolled Out');
  const detail: KpiDetailData | null = kd.activeId
    ? {
        title: kdTitles[kd.activeId],
        columns: [
          { key: 'emp', label: 'Employee' },
          { key: 'code', label: 'Code', className: 'font-mono whitespace-nowrap' },
          { key: 'client', label: 'Client' },
          { key: 'type', label: 'Exit type' },
          { key: 'status', label: 'Status' },
          { key: 'lwd', label: 'LWD', className: 'whitespace-nowrap' },
        ],
        rows: kdCases(kd.activeId).map((c) => ({
          emp: c.employee,
          code: c.empCode,
          client: c.client,
          type: c.exitType,
          status: <Chip tone={STATUS_TONE[c.status]}>{c.status}</Chip>,
          lwd: c.lwd ? formatExitDate(c.lwd) : '—',
        })),
      }
    : null;

  const toggle = (id: string, label: string, enabled: boolean) => {
    toggleRule(id);
    logAudit({ area: 'exit-eligibility', action: `Rule "${label}" switched ${enabled ? 'off' : 'on'}`, subjectId: id, actorId: actor.id, actorName: actor.name });
    showToast(`Rule ${enabled ? 'switched off' : 'switched on'}`);
  };

  return (
    <div className="cc-stack">
      {showExit && (
        <>
          <div className="cc-grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard label="Open exit cases" value={open.length} detail="Not yet closed" icon={DoorOpen} tone="info" onClick={() => { setStatus('all'); kd.toggle('open'); }} active={kd.isActive('open')} />
            <KpiCard label="In notice period" value={cases.filter((c) => c.status === 'Notice period').length} detail="Serving notice" icon={Hourglass} tone="violet" onClick={() => { setStatus('Notice period'); kd.toggle('notice'); }} active={kd.isActive('notice')} />
            <KpiCard label="Awaiting transfer clearance" value={awaitingTransfer} detail="Blocks F&F" icon={Link2} tone="warn" onClick={() => kd.toggle('transfer')} active={kd.isActive('transfer')} />
            <KpiCard label="LWD in next 30 days" value={in30} detail="Open cases" icon={CalendarClock} tone="teal" onClick={() => kd.toggle('lwd')} active={kd.isActive('lwd')} />
            <KpiCard label="Offer Not Rolled Out" value={onro} detail="All time" icon={FileX2} tone="muted" onClick={() => { setType('Offer Not Rolled Out'); kd.toggle('onro'); }} active={kd.isActive('onro')} />
          </div>
          <KpiDetailPanel detail={detail} onClose={kd.close} />

          <SectionCard
            title="Exit cases"
            subtitle="Resignation, termination, contract end, absconding and offers not rolled out"
            action={
              canExit ? (
                <div className="flex flex-wrap gap-2 justify-end">
                  <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setDialog('lwd')}><Upload className="w-3.5 h-3.5" />LWD bulk upload</button>
                  <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setDialog('onro')}><UserMinus className="w-3.5 h-3.5" />Mark Offer Not Rolled Out</button>
                  <button type="button" className="cc-btn cc-btn-primary" onClick={() => setDialog('initiate')}><Plus className="w-3.5 h-3.5" />Initiate exit</button>
                </div>
              ) : undefined
            }
          >
            {!canExit && <div className="mb-3"><ViewOnlyNote /></div>}
            <div className="cc-callout tone-info mb-3">
              <Link2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Exit processing depends on the Transfer module, which is not built yet. Each case therefore carries a <strong>Transfer clearance</strong> field (Not applicable / Pending transfer closure / Cleared) that is set by hand and blocks the move to F&amp;F until it is Cleared.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 cc-muted" />
                <input className="cc-input !pl-8" placeholder="Search employee, code, case id" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search exit cases" />
              </div>
              <SelectMenu value={status} onChange={(e) => setStatus(e.target.value)} className="cc-input" aria-label="Status filter">
                <option value="all">All statuses</option>
                {EXIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectMenu>
              <SelectMenu value={type} onChange={(e) => setType(e.target.value)} className="cc-input" aria-label="Exit type filter">
                <option value="all">All exit types</option>
                {EXIT_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectMenu>
              <SelectMenu value={client} onChange={(e) => setClient(e.target.value)} className="cc-input" aria-label="Client filter">
                <option value="all">All clients</option>
                {clients.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectMenu>
            </div>
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr><th>Employee</th><th>Client</th><th>Exit type</th><th>Notice date</th><th>Last working day</th><th>Transfer clearance</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={7} className="cc-muted text-center py-6">No exit cases match these filters.</td></tr>}
                  {rows.map((c) => (
                    <tr key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                      <td>
                        <button type="button" className="text-left" onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }}>
                          <span className="cc-title font-semibold block">{c.employee}</span>
                          <span className="cc-muted text-[11px]">{c.id} · {c.empCode}</span>
                        </button>
                      </td>
                      <td>{c.client}</td>
                      <td className="whitespace-nowrap">{c.exitType}</td>
                      <td className="whitespace-nowrap">{formatExitDate(c.noticeDate)}</td>
                      <td className="whitespace-nowrap">{formatExitDate(c.lwd)}</td>
                      <td><Chip tone={TRANSFER_TONE[c.transfer]}>{c.transfer}</Chip></td>
                      <td><Chip tone={STATUS_TONE[c.status]}>{c.status}</Chip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      {showElig && (
        <SectionCard
          title="Eligibility rules: Offer Not Rolled Out"
          subtitle="Conditions checked when an employee is marked Offer Not Rolled Out"
          action={canElig ? <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setDialog('onro')}><UserMinus className="w-3.5 h-3.5" />Mark employee</button> : undefined}
        >
          <div className="cc-callout tone-info mb-3">
            <p>Assumption: the condition that used to be mandatory is <strong>"joining formalities completed / LWD already entered"</strong>. It is now optional, so an employee can be marked Offer Not Rolled Out without it. The remaining criteria still apply unless switched off.</p>
          </div>
          {!canElig && <div className="mb-3"><ViewOnlyNote /></div>}
          <ul className="cc-divide">
            {rules.map((r) => (
              <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="cc-title text-xs font-semibold flex flex-wrap items-center gap-2">
                    {r.label}
                    {r.formerlyMandatory && <Chip tone="warn">Formerly mandatory, now optional</Chip>}
                  </p>
                  <p className="cc-muted text-xs mt-0.5">{r.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.enabled}
                  aria-label={`${r.label}: ${r.enabled ? 'on' : 'off'}`}
                  disabled={!canElig}
                  onClick={() => toggle(r.id, r.label, r.enabled)}
                  className={`tone-info relative shrink-0 w-10 h-6 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${r.enabled ? 'bg-[color:var(--tone)] border-transparent' : 'border-[color:var(--cc-card-border)]'}`}
                >
                  <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${r.enabled ? 'left-[1.15rem]' : 'left-0.5 !bg-[color:var(--cc-muted)]'}`} style={{ width: 18, height: 18 }} />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {activity.length > 0 && (
        <SectionCard title="Recent changes" subtitle="This session">
          <ul className="cc-divide text-xs">
            {activity.slice(0, 6).map((a) => (
              <li key={a.id} className="py-2"><p className="cc-title">{a.action}</p><p className="cc-muted">{a.actorName} · {formatAuditTime(a.at)}</p></li>
            ))}
          </ul>
        </SectionCard>
      )}

      {dialog === 'initiate' && <InitiateExitDialog candidates={candidates} onClose={() => setDialog(null)} onDone={showToast} />}
      {dialog === 'onro' && <OnroDialog onClose={() => setDialog(null)} onDone={showToast} />}
      {dialog === 'lwd' && <LwdBulkDialog onClose={() => setDialog(null)} onDone={showToast} />}
      {openId && <ExitCaseDrawer caseId={openId} canManage={canExit} onClose={() => setOpenId(null)} onToast={showToast} />}
      <Toast message={message} onClose={hideToast} />
    </div>
  );
};
