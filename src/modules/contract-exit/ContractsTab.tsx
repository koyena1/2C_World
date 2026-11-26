import React, { useMemo, useState } from 'react';
import {
  AlarmClock,
  BellRing,
  CalendarClock,
  FileCheck2,
  FilePenLine,
  Mail,
  Pencil,
  PhoneCall,
  Send,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { KpiCard } from '../../components/page/KpiCard';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { logAudit } from '../hr-ops/auditStore';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';
import { SectionCard, Chip, EmptyNote } from '../dashboard/command-center/shared';
import type { Tone } from '../dashboard/command-center/types';
import {
  CLIENT_POCS,
  CLIENT_POC_FALLBACK,
  MOCK_CALL_LOG,
  MOCK_CONTRACTS,
  MOCK_WORKFLOWS,
  addDays,
  addMonths,
  daysBetween,
  effectiveEndDate,
  formatContractDate,
  isClosed,
  systemEndDate,
  type CallLogRow,
  type CallOutcome,
  type CallWorkflow,
  type ContractRecord,
} from '../../data/mockContractData';
import { AutomationsSection } from './contracts/AutomationsSection';
import {
  ClosureConfirmDialog,
  EditPeriodDialog,
  ExperienceLetterDialog,
  IntimationDialog,
} from './contracts/ContractDialogs';

const REF = DASHBOARD_REFERENCE_DATE;
const AUDIT_AREA = 'contract-closure';
const REMINDER_DAYS = 35;
const INTIMATION_DAYS = 30;

type WindowFilter = 'all' | '0-15' | '16-35' | '36-60' | '60+';
const WINDOWS: { value: WindowFilter; label: string }[] = [
  { value: 'all', label: 'All windows' },
  { value: '0-15', label: '0-15 days' },
  { value: '16-35', label: '16-35 days' },
  { value: '36-60', label: '36-60 days' },
  { value: '60+', label: 'More than 60 days' },
];

const inWindow = (d: number, w: WindowFilter) =>
  w === 'all' || (w === '0-15' && d <= 15) || (w === '16-35' && d >= 16 && d <= 35) || (w === '36-60' && d >= 36 && d <= 60) || (w === '60+' && d > 60);

const daysTone = (d: number, closed: boolean): Tone => (closed ? 'muted' : d < 0 ? 'bad' : d <= 15 ? 'bad' : d <= 35 ? 'warn' : d <= 60 ? 'info' : 'good');
const daysLabel = (d: number) => (d < 0 ? `${-d}d overdue` : d === 0 ? 'Today' : `${d} days`);

/** Real candidates with an accepted offer letter get a contract whose period comes from that letter. */
const contractsFromCandidates = (candidates: Candidate[]): ContractRecord[] =>
  candidates.flatMap((c): ContractRecord[] => {
    const offers = c.letters.filter((l) => /offer/i.test(l.title) && l.status === 'Accepted');
    if (offers.length === 0 || !c.dateOfJoining) return [];
    const latest = [...offers].sort((a, b) => b.issuedDate.localeCompare(a.issuedDate))[0];
    const ext = c.letters.find((l) => /extension/i.test(l.title) && l.status !== 'Draft');
    const autoEnd = c.endOfContract ?? addDays(addMonths(c.dateOfJoining, 12), -1);
    const poc = CLIENT_POCS[c.clientName] ?? CLIENT_POC_FALLBACK;
    return [
      {
        id: `CT-${c.id}`,
        employeeName: `${c.firstName} ${c.lastName}`.trim(),
        employeeCode: c.clientCandidateCode ?? c.userId,
        designation: c.designation,
        clientName: c.clientName,
        pocName: poc.name,
        pocEmail: poc.email,
        startDate: c.dateOfJoining,
        autoEndDate: autoEnd,
        sourceLetter: latest.title,
        extension: ext ? { title: ext.title, issuedDate: ext.issuedDate, newEndDate: addMonths(autoEnd, 6) } : undefined,
        closureStatus: 'Active',
      },
    ];
  });

export const ContractsTab: React.FC<{ candidates: Candidate[]; onNavigate?: (view: string) => void }> = ({ candidates, onNavigate }) => {
  const closureAccess = useFeatureAccess('contract-closure');
  const callsAccess = useFeatureAccess('auto-calls');
  const { actor } = useRole();
  const { message, showToast } = useToast();
  const canManage = closureAccess === 'manage';
  const canManageCalls = callsAccess === 'manage';

  const [contracts, setContracts] = useState<ContractRecord[]>(() => {
    const seeded = new Set(MOCK_CONTRACTS.map((c) => c.employeeName));
    return [...MOCK_CONTRACTS, ...contractsFromCandidates(candidates).filter((c) => !seeded.has(c.employeeName))];
  });
  const [workflows, setWorkflows] = useState<CallWorkflow[]>(MOCK_WORKFLOWS);
  const [callLog, setCallLog] = useState<CallLogRow[]>(MOCK_CALL_LOG);

  const [clientFilter, setClientFilter] = useState('all');
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const [editing, setEditing] = useState<ContractRecord | null>(null);
  const [intimating, setIntimating] = useState<ContractRecord | 'template' | null>(null);
  const [confirmClosure, setConfirmClosure] = useState(false);
  const [letterFor, setLetterFor] = useState<ContractRecord | null>(null);

  const dl = (c: ContractRecord) => daysBetween(REF, effectiveEndDate(c));
  const patch = (id: string, change: Partial<ContractRecord>) => setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...change } : c)));
  const audit = (action: string, subjectId?: string) => logAudit({ area: AUDIT_AREA, action, subjectId, actorId: actor.id, actorName: actor.name });
  const nowStamp = () => `${REF}T${String(10 + (callLog.length % 8)).padStart(2, '0')}:30:00`;

  const clients = useMemo(() => [...new Set(contracts.map((c) => c.clientName))].sort(), [contracts]);
  const open = contracts.filter((c) => !isClosed(c));

  const kpis = useMemo(
    () => ({
      expiring: open.filter((c) => dl(c) >= 0 && dl(c) <= REMINDER_DAYS).length,
      intimationsDue: open.filter((c) => dl(c) >= 0 && dl(c) <= INTIMATION_DAYS && !c.intimationSentAt).length,
      closures: contracts.filter((c) => c.closureStatus === 'Closure initiated').length,
      callsToday: callLog.filter((r) => r.at.startsWith(REF)).length,
    }),
    [contracts, callLog] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { activeId, toggle, close, isActive } = useKpiDetail<'expiring' | 'intimations' | 'closures' | 'calls'>();
  const contractCols = [
    { key: 'name', label: 'Employee' },
    { key: 'client', label: 'Client' },
    { key: 'end', label: 'End date', className: 'whitespace-nowrap' },
    { key: 'left', label: 'Days left' },
    { key: 'status', label: 'Status' },
  ];
  const contractRow = (c: ContractRecord) => ({
    name: c.employeeName,
    client: c.clientName,
    end: formatContractDate(effectiveEndDate(c)),
    left: <Chip tone={daysTone(dl(c), isClosed(c))}>{daysLabel(dl(c))}</Chip>,
    status: c.closureStatus,
  });
  const detail: KpiDetailData | null = !activeId
    ? null
    : activeId === 'expiring'
      ? { title: 'Expiring in 35 days', columns: contractCols, rows: open.filter((c) => dl(c) >= 0 && dl(c) <= REMINDER_DAYS).map(contractRow) }
      : activeId === 'intimations'
        ? {
            title: 'Intimations due',
            columns: [...contractCols, { key: 'poc', label: 'Client POC' }],
            rows: open.filter((c) => dl(c) >= 0 && dl(c) <= INTIMATION_DAYS && !c.intimationSentAt).map((c) => ({ ...contractRow(c), poc: c.pocName })),
          }
        : activeId === 'closures'
          ? { title: 'Closures in progress', columns: contractCols, rows: contracts.filter((c) => c.closureStatus === 'Closure initiated').map(contractRow) }
          : {
              title: 'Auto-calls today',
              columns: [
                { key: 'name', label: 'Employee' },
                { key: 'wf', label: 'Workflow' },
                { key: 'attempt', label: 'Attempt' },
                { key: 'outcome', label: 'Outcome' },
                { key: 'at', label: 'Time', className: 'whitespace-nowrap' },
              ],
              rows: callLog.filter((r) => r.at.startsWith(REF)).map((r) => ({ name: r.employeeName, wf: r.workflow, attempt: r.attempt, outcome: r.outcome, at: r.at })),
            };

  const rows = useMemo(
    () =>
      contracts
        .filter((c) => clientFilter === 'all' || c.clientName === clientFilter)
        .filter((c) => inWindow(dl(c), windowFilter))
        .filter((c) => statusFilter === 'all' || c.closureStatus === statusFilter)
        .sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || dl(a) - dl(b)),
    [contracts, clientFilter, windowFilter, statusFilter] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const reminderNow = open.filter((c) => dl(c) <= REMINDER_DAYS).sort((a, b) => dl(a) - dl(b));
  const reminderNext = open.filter((c) => dl(c) > REMINDER_DAYS && dl(c) <= REMINDER_DAYS * 2).sort((a, b) => dl(a) - dl(b));

  const intimationStatus = (c: ContractRecord): { label: string; tone: Tone } => {
    if (c.intimationSentAt) return { label: 'Intimation sent', tone: 'good' };
    const d = dl(c);
    return d <= INTIMATION_DAYS && !isClosed(c) ? { label: 'Intimation due', tone: 'warn' } : { label: 'Not due', tone: 'muted' };
  };

  const ackReminder = (c: ContractRecord) => {
    patch(c.id, { reminderAckedAt: `${REF}T09:00:00` });
    audit(`acknowledged expiry reminder for ${c.employeeName}`, c.id);
    showToast(`Reminder acknowledged for ${c.employeeName}`);
  };

  const sendIntimation = (c: ContractRecord) => {
    const at = nowStamp();
    patch(c.id, { intimationSentAt: at });
    audit(`sent client intimation to ${c.pocName} for ${c.employeeName}`, c.id);
    setIntimating(null);
    showToast(`Intimation sent to ${c.pocName} (${c.clientName})`);
  };

  const saveCorrection = (c: ContractRecord, endDate: string, reason: string) => {
    patch(c.id, { manual: { endDate, reason, by: actor.name, at: `${REF}T${String(12 + (callLog.length % 6)).padStart(2, '0')}:00:00` } });
    audit(`corrected contract end date of ${c.employeeName} to ${endDate} (${reason})`, c.id);
    setEditing(null);
    showToast('Contract period corrected manually');
  };

  const clearCorrection = (c: ContractRecord) => {
    patch(c.id, { manual: undefined });
    audit(`reverted manual end date correction for ${c.employeeName}`, c.id);
    setEditing(null);
    showToast('Reverted to the system-derived end date');
  };

  const selectedContracts = contracts.filter((c) => selected.includes(c.id));
  const toggleSelect = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const initiateClosure = () => {
    const at = nowStamp();
    setContracts((prev) => prev.map((c) => (selected.includes(c.id) ? { ...c, closureStatus: 'Closure initiated', closureAt: at } : c)));
    selectedContracts.forEach((c) => audit(`initiated contract closure for ${c.employeeName}`, c.id));
    showToast(`Closure initiated for ${selected.length} contract${selected.length === 1 ? '' : 's'}`);
    setSelected([]);
    setConfirmClosure(false);
  };

  const generateLetter = (c: ContractRecord) => {
    patch(c.id, { closureStatus: 'Experience letter generated', closureAt: nowStamp() });
    audit(`generated experience letter for ${c.employeeName}`, c.id);
    showToast(`Experience letter generated for ${c.employeeName}`);
    setLetterFor({ ...c, closureStatus: 'Experience letter generated' });
  };

  const openLetterBuilder = () => {
    if (onNavigate) onNavigate('offer-letters');
    else showToast('Letter Builder lives under Offer Letters -> Templates');
  };

  const changeWorkflow = (id: CallWorkflow['id'], change: Partial<CallWorkflow>, note: string) => {
    const wf = workflows.find((w) => w.id === id);
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, ...change } : w)));
    audit(`${note} ${wf?.name ?? id}`, id);
    showToast(`${wf?.name} ${note.startsWith('updated') ? 'saved' : note}`);
  };

  const runNow = () => {
    const OUTCOMES: CallOutcome[] = ['Connected', 'No answer', 'Callback', 'Connected'];
    const added: CallLogRow[] = [];
    let seq = callLog.length;
    workflows
      .filter((w) => w.enabled)
      .forEach((w) => {
        const max = Math.max(...w.triggerDays);
        open
          .filter((c) => dl(c) >= 0 && dl(c) <= max)
          .forEach((c) => {
            const prev = [...callLog, ...added].filter((r) => r.contractId === c.id && r.workflow === w.id);
            if (prev.length >= w.maxAttempts || prev.some((r) => r.outcome === 'Connected')) return;
            seq += 1;
            added.push({
              id: `CALL-${seq + 100}`,
              contractId: c.id,
              employeeName: c.employeeName,
              workflow: w.id,
              attempt: prev.length + 1,
              outcome: OUTCOMES[(seq + c.employeeName.length) % OUTCOMES.length],
              at: `${REF} ${String(14 + Math.floor(added.length / 4)).padStart(2, '0')}:${String((added.length % 4) * 15).padStart(2, '0')}`,
            });
          });
      });
    if (added.length === 0) return showToast('No contracts are due for a call right now');
    setCallLog((prev) => [...added.reverse(), ...prev]);
    audit(`ran auto-call workflows (simulated), ${added.length} calls placed`);
    showToast(`${added.length} automated call${added.length === 1 ? '' : 's'} placed (simulated)`);
  };

  const showClosure = closureAccess !== 'none';
  const showCalls = callsAccess !== 'none';

  const ReminderRow: React.FC<{ c: ContractRecord; upcoming?: boolean }> = ({ c, upcoming }) => (
    <li className="py-2 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="cc-title text-xs font-semibold truncate">
          {c.employeeName} <span className="cc-muted font-normal">· {c.clientName}</span>
        </p>
        <p className="cc-muted text-[11px]">
          Ends {formatContractDate(effectiveEndDate(c))}
          {upcoming ? ` · reminder starts in ${dl(c) - REMINDER_DAYS} days` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Chip tone={daysTone(dl(c), false)}>{daysLabel(dl(c))}</Chip>
        {!upcoming &&
          (c.reminderAckedAt ? (
            <Chip tone="good">Acknowledged</Chip>
          ) : (
            <button type="button" className="cc-btn cc-btn-secondary" disabled={!canManage} onClick={() => ackReminder(c)}>
              Acknowledge
            </button>
          ))}
      </div>
    </li>
  );

  return (
    <div className="cc-stack">
      {showClosure && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard onClick={() => toggle('expiring')} active={isActive('expiring')} label="Expiring in 35 days" value={kpis.expiring} detail="Contracts not yet closed" icon={CalendarClock} tone="warn" />
            <KpiCard onClick={() => toggle('intimations')} active={isActive('intimations')} label="Intimations due" value={kpis.intimationsDue} detail="Client email pending (30-day rule)" icon={Mail} tone="bad" />
            <KpiCard onClick={() => toggle('closures')} active={isActive('closures')} label="Closures in progress" value={kpis.closures} detail="Awaiting experience letter" icon={FileCheck2} tone="info" />
            <KpiCard onClick={() => toggle('calls')} active={isActive('calls')} label="Auto-calls today" value={kpis.callsToday} detail="Extension and closure workflows" icon={PhoneCall} tone="teal" />
          </div>
          <KpiDetailPanel detail={detail} onClose={close} />
          {!canManage && (
            <p className="cc-muted text-[11px] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> View only: you can review contracts but not change them.
            </p>
          )}

          <SectionCard
            title="Dashboard reminders"
            subtitle="Admin and the Onboarding team are reminded from 35 days before expiry"
            action={
              <span className="cc-muted text-[11px] flex items-center gap-1 shrink-0">
                <BellRing className="w-3.5 h-3.5" /> {reminderNow.filter((c) => !c.reminderAckedAt).length} unacknowledged
              </span>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="min-w-0">
                <h3 className="cc-title text-xs font-bold mb-1 flex items-center gap-1.5">
                  <AlarmClock className="w-3.5 h-3.5" /> Due now (expiring within 35 days)
                </h3>
                {reminderNow.length === 0 ? (
                  <EmptyNote>No reminders due today.</EmptyNote>
                ) : (
                  <ul className="cc-divide max-h-64 overflow-y-auto">
                    {reminderNow.map((c) => (
                      <ReminderRow key={c.id} c={c} />
                    ))}
                  </ul>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="cc-title text-xs font-bold mb-1 flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" /> Reminders starting in the next 35 days
                </h3>
                {reminderNext.length === 0 ? (
                  <EmptyNote>No further reminders scheduled.</EmptyNote>
                ) : (
                  <ul className="cc-divide max-h-64 overflow-y-auto">
                    {reminderNext.map((c) => (
                      <ReminderRow key={c.id} c={c} upcoming />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Contract expiry tracking"
            subtitle="Period auto-populated from the latest offer letter, updated by extension letters, with manual correction"
            action={
              <div className="flex flex-wrap gap-2 justify-end">
                <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setIntimating('template')}>
                  <Mail className="w-3.5 h-3.5" /> Intimation template
                </button>
                <button type="button" className="cc-btn cc-btn-secondary" onClick={openLetterBuilder}>
                  <FilePenLine className="w-3.5 h-3.5" /> Letter Builder
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <SelectMenu aria-label="Filter by client" className="cc-input" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                <option value="all">All clients</option>
                {clients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectMenu>
              <SelectMenu aria-label="Filter by expiry window" className="cc-input" value={windowFilter} onChange={(e) => setWindowFilter(e.target.value as WindowFilter)}>
                {WINDOWS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </SelectMenu>
              <SelectMenu aria-label="Filter by status" className="cc-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Closure initiated">Closure initiated</option>
                <option value="Experience letter generated">Experience letter generated</option>
              </SelectMenu>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="cc-muted text-[11px]">
                {rows.length} of {contracts.length} contracts, sorted by days left
              </p>
              <button type="button" className="cc-btn cc-btn-primary" disabled={!canManage || selected.length === 0} onClick={() => setConfirmClosure(true)}>
                <FileCheck2 className="w-3.5 h-3.5" /> Initiate closure ({selected.length})
              </button>
            </div>

            <div className="cc-table-wrap">
              <table className="cc-table min-w-[1180px]">
                <thead>
                  <tr>
                    <th className="w-8">
                      <span className="sr-only">Select for closure</span>
                    </th>
                    <th>Employee</th>
                    <th>Client</th>
                    <th>Contract period</th>
                    <th>Days left</th>
                    <th>Client intimation</th>
                    <th>Closure</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <EmptyNote>No contracts match these filters.</EmptyNote>
                      </td>
                    </tr>
                  )}
                  {rows.map((c) => {
                    const d = dl(c);
                    const closed = isClosed(c);
                    const intim = intimationStatus(c);
                    return (
                      <tr key={c.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            aria-label={`Select ${c.employeeName} for closure`}
                            checked={selected.includes(c.id)}
                            disabled={!canManage || c.closureStatus !== 'Active'}
                            onChange={() => toggleSelect(c.id)}
                          />
                        </td>
                        <td>
                          <p className="cc-title font-semibold whitespace-nowrap">{c.employeeName}</p>
                          <p className="cc-muted text-[11px]">
                            {c.employeeCode} · {c.designation}
                          </p>
                        </td>
                        <td className="whitespace-nowrap">{c.clientName}</td>
                        <td>
                          <p className="whitespace-nowrap tabular-nums">
                            {formatContractDate(c.startDate)} to <strong className="cc-title">{formatContractDate(effectiveEndDate(c))}</strong>
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="cc-muted text-[11px]">{c.extension ? c.extension.title : c.sourceLetter}</span>
                            {c.extension && <Chip tone="violet">Extended</Chip>}
                            {c.manual && (
                              <span title={`${c.manual.reason} (${c.manual.by})`}>
                                <Chip tone="warn">Edited manually</Chip>
                              </span>
                            )}
                          </div>
                          {c.manual && (
                            <p className="cc-muted text-[11px]">System date: {formatContractDate(systemEndDate(c))}</p>
                          )}
                        </td>
                        <td>
                          <Chip tone={daysTone(d, closed)}>{closed ? 'Closed' : daysLabel(d)}</Chip>
                        </td>
                        <td>
                          <Chip tone={intim.tone}>{intim.label}</Chip>
                          {c.intimationSentAt && <p className="cc-muted text-[11px] mt-0.5">{c.intimationSentAt.slice(0, 16).replace('T', ' ')}</p>}
                        </td>
                        <td>
                          <Chip tone={closed ? 'good' : c.closureStatus === 'Closure initiated' ? 'info' : 'muted'}>{c.closureStatus}</Chip>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1.5 min-w-[200px]">
                            <button type="button" className="cc-btn cc-btn-secondary" disabled={!canManage || closed} onClick={() => setEditing(c)} aria-label={`Correct period for ${c.employeeName}`}>
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            {!closed && (
                              <button
                                type="button"
                                className="cc-btn cc-btn-secondary"
                                disabled={!canManage && !c.intimationSentAt}
                                onClick={() => setIntimating(c)}
                              >
                                <Send className="w-3.5 h-3.5" /> {c.intimationSentAt ? 'View email' : 'Send intimation'}
                              </button>
                            )}
                            {c.closureStatus === 'Closure initiated' && (
                              <button type="button" className="cc-btn cc-btn-primary" disabled={!canManage} onClick={() => generateLetter(c)}>
                                <FileCheck2 className="w-3.5 h-3.5" /> Generate letter
                              </button>
                            )}
                            {closed && (
                              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setLetterFor(c)}>
                                <Eye className="w-3.5 h-3.5" /> View letter
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="cc-muted text-[11px] mt-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> The client POC is emailed {INTIMATION_DAYS} days before expiry using the standard template.
            </p>
          </SectionCard>
        </>
      )}

      {showCalls && (
        <AutomationsSection
          workflows={workflows}
          log={callLog}
          contracts={contracts}
          daysLeftOf={dl}
          canManage={canManageCalls}
          onChangeWorkflow={changeWorkflow}
          onRunNow={runNow}
        />
      )}

      {editing && (
        <EditPeriodDialog
          key={editing.id}
          contract={contracts.find((c) => c.id === editing.id) ?? editing}
          onSave={(end, reason) => saveCorrection(editing, end, reason)}
          onClearManual={() => clearCorrection(editing)}
          onClose={() => setEditing(null)}
        />
      )}
      {intimating && (
        <IntimationDialog
          contract={intimating === 'template' ? null : (contracts.find((c) => c.id === intimating.id) ?? intimating)}
          days={intimating === 'template' ? 0 : dl(intimating)}
          canSend={canManage}
          onSend={() => intimating !== 'template' && sendIntimation(intimating)}
          onClose={() => setIntimating(null)}
        />
      )}
      {confirmClosure && <ClosureConfirmDialog contracts={selectedContracts} onConfirm={initiateClosure} onClose={() => setConfirmClosure(false)} />}
      {letterFor && (
        <ExperienceLetterDialog
          contract={letterFor}
          generatedOn={formatContractDate((letterFor.closureAt ?? REF).slice(0, 10))}
          onClose={() => setLetterFor(null)}
        />
      )}
      <Toast message={message} />
    </div>
  );
};
