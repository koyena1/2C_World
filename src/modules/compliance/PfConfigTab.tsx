import React, { useMemo, useState } from 'react';
import { BadgeCheck, Building2, Link2Off, Pencil, Search, Sparkles, UserX } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { KpiCard } from '../../components/page/KpiCard';
import { SectionCard, Chip } from '../dashboard/command-center/shared';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { PaginationControls, PaginationSummary } from '../../components/ui/Pagination';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { formatAuditTime, logAudit } from '../hr-ops/auditStore';
import {
  DEFAULT_PF_RULES,
  MOCK_PF_CANDIDATE_RECORDS,
  MOCK_PF_CLIENT_CONFIG,
  resolvePfApplicability,
  type PfApplicability,
  type PfCandidateRecord,
  type PfClientConfig,
  type PfOverride,
  type PfRules,
} from '../../data/mockUanData';
import { UanDialog, ViewOnlyNote } from './uan/UanDialog';

const AREA = 'pf-config';
const PAGE_SIZE = 10;
const UAN_RE = /^\d{12}$/;
const inr = (n: number) => `Rs ${n.toLocaleString('en-IN')}`;

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'violet' | 'teal' | 'muted';
const APPLICABILITY_TONE: Record<PfApplicability, Tone> = {
  Mandatory: 'info',
  'Higher-wage opted in': 'violet',
  'Voluntary (capped)': 'teal',
  Exempt: 'muted',
  'Not applicable': 'muted',
};

const blankPf = (candidateId: string): PfCandidateRecord => ({
  candidateId, oldUan: '', newUan: '', uanRegistered: false, pfLinked: false, override: 'inherit', updatedBy: '', updatedAt: '',
});

/** Combined UAN + PF chip built from the two separate flags. */
const PfStatusChip: React.FC<{ registered: boolean; linked: boolean }> = ({ registered, linked }) => {
  if (!registered) return <Chip tone="bad">Not registered</Chip>;
  if (!linked) return <Chip tone="warn">Registered, PF not linked</Chip>;
  return <Chip tone="good">Registered &amp; PF linked</Chip>;
};

const Empty: React.FC<{ label: string }> = ({ label }) => <span className="cc-muted italic">{label}</span>;
const YesNo: React.FC<{ v: boolean }> = ({ v }) => <Chip tone={v ? 'good' : 'muted'}>{v ? 'Yes' : 'No'}</Chip>;

export const PfConfigTab: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const access = useFeatureAccess('pf-config');
  const canEdit = access === 'manage';
  const { actor } = useRole();
  const { message, showToast } = useToast();

  const [rules, setRules] = useState<PfRules>(DEFAULT_PF_RULES);
  const [clientCfg, setClientCfg] = useState<PfClientConfig[]>(MOCK_PF_CLIENT_CONFIG);
  const [records, setRecords] = useState<Record<string, PfCandidateRecord>>(() =>
    Object.fromEntries(MOCK_PF_CANDIDATE_RECORDS.map((r) => [r.candidateId, r])),
  );
  const [editRules, setEditRules] = useState(false);
  const [editClient, setEditClient] = useState<PfClientConfig | null>(null);
  const [editCand, setEditCand] = useState<Candidate | null>(null);

  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [pfFilter, setPfFilter] = useState('all');
  const [appFilter, setAppFilter] = useState('all');
  const [page, setPage] = useState(1);

  const recOf = (id: string) => records[id] ?? blankPf(id);
  const clientDefault = (clientId: string) => clientCfg.find((c) => c.clientId === clientId)?.higherWageDefault ?? false;
  const basicOf = (c: Candidate) => Math.round((c.grossSalaryMonthly * rules.basicPercentOfGross) / 100);
  const optedInOf = (c: Candidate, r: PfCandidateRecord) =>
    r.override === 'inherit' ? clientDefault(c.clientId) : r.override === 'opted-in';
  const applicabilityOf = (c: Candidate) => {
    const r = recOf(c.id);
    return resolvePfApplicability(basicOf(c), rules, optedInOf(c, r), !!r.oldUan);
  };

  const rows = useMemo(
    () => candidates.map((c) => ({ c, r: recOf(c.id), app: applicabilityOf(c) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidates, records, rules, clientCfg],
  );

  const kpis = useMemo(() => ({
    applicable: rows.filter((x) => ['Mandatory', 'Higher-wage opted in', 'Voluntary (capped)'].includes(x.app.result)).length,
    higher: rows.filter((x) => x.app.result === 'Higher-wage opted in').length,
    notLinked: rows.filter((x) => x.r.uanRegistered && !x.r.pfLinked).length,
    notRegistered: rows.filter((x) => !x.r.uanRegistered).length,
  }), [rows]);

  const clients = useMemo(() => Array.from(new Set(candidates.map((c) => c.clientName))).sort(), [candidates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ c, r, app }) => {
      if (clientFilter !== 'all' && c.clientName !== clientFilter) return false;
      if (pfFilter === 'not-registered' && r.uanRegistered) return false;
      if (pfFilter === 'not-linked' && !(r.uanRegistered && !r.pfLinked)) return false;
      if (pfFilter === 'linked' && !(r.uanRegistered && r.pfLinked)) return false;
      if (appFilter !== 'all' && app.result !== appFilter) return false;
      if (!q) return true;
      return [`${c.firstName} ${c.lastName}`, c.userId, c.clientName, r.oldUan, r.newUan].some((v) => v.toLowerCase().includes(q));
    });
  }, [rows, query, clientFilter, pfFilter, appFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const resetPage = () => setPage(1);

  const audit = (action: string, subjectId?: string) =>
    logAudit({ area: AREA, action, subjectId, actorId: actor.id, actorName: actor.name });

  const ruleRows: { rule: string; value: string; detail: string }[] = [
    { rule: 'Basic wage ceiling', value: `${inr(rules.wageCeiling)} / month`, detail: `Statutory wage limit. Basic wage is taken as ${rules.basicPercentOfGross}% of gross salary.` },
    { rule: 'Contribution rate', value: `${rules.contributionRate}% employee + ${rules.contributionRate}% employer`, detail: 'Applied on basic wage up to the ceiling, or on actual basic wage when the higher-wage flag is on.' },
    { rule: 'Mandatory up to the ceiling', value: rules.mandatoryBelowCeiling ? 'Yes' : 'No', detail: 'Candidates whose basic wage is within the ceiling are enrolled automatically.' },
    { rule: 'Voluntary above the ceiling', value: rules.voluntaryAboveCeiling ? 'Allowed (capped at ceiling)' : 'Not allowed', detail: 'Existing PF members earning above the ceiling may continue; contribution stays capped.' },
    { rule: 'New-joiner exemption', value: rules.newJoinerExemption ? 'Exempt above ceiling' : 'Not applied', detail: 'New joiners above the ceiling with no earlier UAN (no prior PF membership) are exempt unless opted in.' },
    { rule: 'Higher-wage contribution opted in (new flag)', value: 'Per client default + per-candidate override', detail: 'When on, an above-ceiling candidate contributes on the actual basic wage, overriding the exemption and the cap.' },
  ];

  return (
    <div className="cc-stack">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="PF applicable" value={kpis.applicable} detail="Mandatory, opted in or voluntary" icon={BadgeCheck} tone="info" />
        <KpiCard label="Higher-wage opted in" value={kpis.higher} detail="Contributing on actual wage" icon={Sparkles} tone="violet" onClick={() => { setAppFilter('Higher-wage opted in'); resetPage(); }} />
        <KpiCard label="Registered, PF not linked" value={kpis.notLinked} detail="UAN active, PF link pending" icon={Link2Off} tone="warn" onClick={() => { setPfFilter('not-linked'); resetPage(); }} />
        <KpiCard label="UAN not registered" value={kpis.notRegistered} detail="No new UAN on record" icon={UserX} tone="bad" onClick={() => { setPfFilter('not-registered'); resetPage(); }} />
      </div>

      <SectionCard
        title="PF applicability rules"
        subtitle="Current logic used to decide whether PF applies to a candidate."
        action={canEdit ? <button type="button" className="cc-btn cc-btn-primary" onClick={() => setEditRules(true)}><Pencil className="w-3.5 h-3.5" /> Edit rules</button> : <ViewOnlyNote />}
      >
        <div className="cc-table-wrap">
          <table className="cc-table min-w-[640px]">
            <thead><tr><th>Rule</th><th>Current setting</th><th>How it works</th></tr></thead>
            <tbody>
              {ruleRows.map((r) => (
                <tr key={r.rule}>
                  <td className="cc-title font-semibold whitespace-nowrap">{r.rule}</td>
                  <td className="whitespace-nowrap">{r.value}</td>
                  <td className="cc-muted">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cc-callout tone-violet mt-3">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="cc-title">How the new flag changes applicability.</strong>{' '}
            Order of checks: (1) basic wage within the ceiling means PF is mandatory. (2) Above the ceiling with the flag on means PF applies on the actual basic wage. (3) Above the ceiling with the flag off: new joiners are exempt, existing members may contribute voluntarily on the capped wage.
            The flag comes from the client default and can be overridden per candidate (Inherit, Opted in, Opted out).
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Client configuration" subtitle="Default for the higher-wage flag, applied to every candidate of the client unless overridden.">
        <div className="cc-table-wrap">
          <table className="cc-table min-w-[720px]">
            <thead><tr><th>Client</th><th>Higher-wage default</th><th>Candidates</th><th>Overrides</th><th>Last updated</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {clientCfg.map((cfg) => {
                const own = candidates.filter((c) => c.clientId === cfg.clientId);
                const overrides = own.filter((c) => recOf(c.id).override !== 'inherit').length;
                return (
                  <tr key={cfg.clientId}>
                    <td className="cc-title font-semibold"><span className="inline-flex items-center gap-2"><Building2 className="w-3.5 h-3.5 cc-muted" />{cfg.clientName}</span></td>
                    <td><Chip tone={cfg.higherWageDefault ? 'violet' : 'muted'}>{cfg.higherWageDefault ? 'Opted in' : 'Not opted in'}</Chip></td>
                    <td className="tabular-nums">{own.length}</td>
                    <td className="tabular-nums">{overrides}</td>
                    <td><div>{cfg.updatedBy}</div><div className="cc-muted text-[11px]">{formatAuditTime(cfg.updatedAt)}</div></td>
                    <td className="text-right">
                      <button type="button" className="cc-btn cc-btn-secondary" disabled={!canEdit} onClick={() => setEditClient(cfg)} aria-label={`Edit ${cfg.clientName}`}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Candidate PF and UAN" subtitle="Old and new UAN are stored separately; UAN registration and PF linking are tracked as two flags.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_190px] gap-2 mb-3">
          <label className="relative block">
            <Search className="w-3.5 h-3.5 cc-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="cc-input" style={{ paddingLeft: 32 }} placeholder="Search candidate, ID, client or UAN" value={query} onChange={(e) => { setQuery(e.target.value); resetPage(); }} aria-label="Search candidates" />
          </label>
          <SelectMenu className="cc-input" value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); resetPage(); }} aria-label="Filter by client">
            <option value="all">All clients</option>
            {clients.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectMenu>
          <SelectMenu className="cc-input" value={pfFilter} onChange={(e) => { setPfFilter(e.target.value); resetPage(); }} aria-label="Filter by UAN and PF status">
            <option value="all">All UAN / PF status</option>
            <option value="not-registered">Not registered</option>
            <option value="not-linked">Registered, PF not linked</option>
            <option value="linked">Registered &amp; PF linked</option>
          </SelectMenu>
          <SelectMenu className="cc-input" value={appFilter} onChange={(e) => { setAppFilter(e.target.value); resetPage(); }} aria-label="Filter by applicability">
            <option value="all">All applicability</option>
            {(Object.keys(APPLICABILITY_TONE) as PfApplicability[]).map((a) => <option key={a} value={a}>{a}</option>)}
          </SelectMenu>
        </div>

        <div className="cc-table-wrap">
          <table className="cc-table min-w-[1100px]">
            <thead>
              <tr>
                <th>Candidate</th><th>Client</th><th>Basic wage</th><th>Old UAN</th><th>New UAN</th><th>UAN registered</th><th>PF linked</th><th>UAN / PF status</th><th>PF applicability</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ c, r, app }) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap"><div className="cc-title font-semibold">{c.firstName} {c.lastName}</div><div className="cc-muted text-[11px]">{c.userId}</div></td>
                  <td className="whitespace-nowrap">{c.clientName}</td>
                  <td className="tabular-nums whitespace-nowrap">{inr(basicOf(c))}</td>
                  <td className="tabular-nums whitespace-nowrap">{r.oldUan || <Empty label="None" />}</td>
                  <td className="tabular-nums whitespace-nowrap">{r.newUan || <Empty label="Pending" />}</td>
                  <td><YesNo v={r.uanRegistered} /></td>
                  <td><YesNo v={r.pfLinked} /></td>
                  <td><PfStatusChip registered={r.uanRegistered} linked={r.pfLinked} /></td>
                  <td>
                    <Chip tone={APPLICABILITY_TONE[app.result]}>{app.result}</Chip>
                    {r.override !== 'inherit' && <div className="cc-muted text-[10px] mt-0.5">Override: {r.override === 'opted-in' ? 'opted in' : 'opted out'}</div>}
                  </td>
                  <td className="text-right">
                    <button type="button" className="cc-btn cc-btn-secondary" disabled={!canEdit} onClick={() => setEditCand(c)} aria-label={`Edit PF details for ${c.firstName} ${c.lastName}`}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && <tr><td colSpan={10} className="cc-muted text-center py-8">No candidates match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 mt-3">
          <PaginationSummary page={current} total={filtered.length} pageSize={PAGE_SIZE} itemLabel="candidates" />
          <PaginationControls page={current} totalPages={totalPages} onPageChange={setPage} mobileIndicator />
        </div>
      </SectionCard>

      {editRules && (
        <RulesDialog
          rules={rules}
          onClose={() => setEditRules(false)}
          onSave={(next) => {
            const diffs = (Object.keys(next) as (keyof PfRules)[]).filter((k) => next[k] !== rules[k]);
            setEditRules(false);
            if (!diffs.length) return showToast('No changes to save');
            setRules(next);
            audit(`PF rules changed: ${diffs.map((k) => `${k} ${String(rules[k])} to ${String(next[k])}`).join('; ')}`);
            showToast('PF applicability rules updated');
          }}
        />
      )}
      {editClient && (
        <ClientDialog
          cfg={editClient}
          onClose={() => setEditClient(null)}
          onSave={(flag) => {
            const cfg = editClient;
            setEditClient(null);
            if (flag === cfg.higherWageDefault) return showToast('No changes to save');
            setClientCfg((p) => p.map((x) => (x.clientId === cfg.clientId ? { ...x, higherWageDefault: flag, updatedBy: actor.name, updatedAt: new Date().toISOString() } : x)));
            audit(`${cfg.clientName}: higher-wage default changed to ${flag ? 'opted in' : 'not opted in'}`, cfg.clientId);
            showToast(`Client default updated for ${cfg.clientName}`);
          }}
        />
      )}
      {editCand && (
        <CandidateDialog
          candidate={editCand}
          record={recOf(editCand.id)}
          rules={rules}
          basic={basicOf(editCand)}
          clientDefault={clientDefault(editCand.clientId)}
          onClose={() => setEditCand(null)}
          onSave={(next) => {
            const c = editCand;
            const prev = recOf(c.id);
            setEditCand(null);
            const diffs = (['oldUan', 'newUan', 'uanRegistered', 'pfLinked', 'override'] as const).filter((k) => prev[k] !== next[k]);
            if (!diffs.length) return showToast('No changes to save');
            setRecords((p) => ({ ...p, [c.id]: { ...prev, ...next, updatedBy: actor.name, updatedAt: new Date().toISOString() } }));
            audit(`${c.firstName} ${c.lastName}: ${diffs.map((k) => `${k} ${String(prev[k]) || 'blank'} to ${String(next[k]) || 'blank'}`).join('; ')}`, c.id);
            showToast(`PF details updated for ${c.firstName} ${c.lastName}`);
          }}
        />
      )}
      <Toast message={message} />
    </div>
  );
};

/* ---------------------------------- dialogs ---------------------------------- */

const Check: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ label, hint, checked, onChange, disabled }) => (
  <label className={`flex items-start gap-2.5 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
    <input type="checkbox" className="mt-0.5" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <span><span className="cc-title font-semibold block">{label}</span>{hint && <span className="cc-muted">{hint}</span>}</span>
  </label>
);

const FooterButtons: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => (
  <>
    <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Cancel</button>
    <button type="button" className="cc-btn cc-btn-primary" onClick={onSave}>Save changes</button>
  </>
);

const RulesDialog: React.FC<{ rules: PfRules; onClose: () => void; onSave: (r: PfRules) => void }> = ({ rules, onClose, onSave }) => {
  const [draft, setDraft] = useState<PfRules>(rules);
  const [tried, setTried] = useState(false);
  const ceilErr = !(draft.wageCeiling >= 1000 && draft.wageCeiling <= 100000) ? 'Enter a ceiling between Rs 1,000 and Rs 1,00,000.' : '';
  const rateErr = !(draft.contributionRate > 0 && draft.contributionRate <= 20) ? 'Rate must be above 0 and at most 20%.' : '';
  const basicErr = !(draft.basicPercentOfGross >= 20 && draft.basicPercentOfGross <= 100) ? 'Enter 20 to 100.' : '';
  const set = <K extends keyof PfRules>(k: K, v: PfRules[K]) => setDraft((p) => ({ ...p, [k]: v }));
  const err = (m: string) => (tried && m ? <p className="text-[11px] mt-1 tone-bad tone-chip inline-block px-2 rounded">{m}</p> : null);
  return (
    <UanDialog title="Edit PF applicability rules" subtitle="Changes apply to every candidate immediately and are recorded in the audit trail." onClose={onClose} wide
      footer={<FooterButtons onClose={onClose} onSave={() => { setTried(true); if (!ceilErr && !rateErr && !basicErr) onSave(draft); }} />}>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="cc-label" htmlFor="pf-ceiling">Wage ceiling (Rs / month)</label>
          <input id="pf-ceiling" type="number" className="cc-input" value={draft.wageCeiling} onChange={(e) => set('wageCeiling', Number(e.target.value))} />
          {err(ceilErr)}
        </div>
        <div>
          <label className="cc-label" htmlFor="pf-rate">Contribution rate (%)</label>
          <input id="pf-rate" type="number" className="cc-input" value={draft.contributionRate} onChange={(e) => set('contributionRate', Number(e.target.value))} />
          {err(rateErr)}
        </div>
        <div>
          <label className="cc-label" htmlFor="pf-basic">Basic as % of gross</label>
          <input id="pf-basic" type="number" className="cc-input" value={draft.basicPercentOfGross} onChange={(e) => set('basicPercentOfGross', Number(e.target.value))} />
          {err(basicErr)}
        </div>
      </div>
      <Check label="PF mandatory up to the ceiling" hint="Auto-enrol candidates whose basic wage is within the ceiling." checked={draft.mandatoryBelowCeiling} onChange={(v) => set('mandatoryBelowCeiling', v)} />
      <Check label="Voluntary contribution above the ceiling" hint="Existing PF members above the ceiling may continue on the capped wage." checked={draft.voluntaryAboveCeiling} onChange={(v) => set('voluntaryAboveCeiling', v)} />
      <Check label="Exempt new joiners above the ceiling" hint="Applies to candidates with no old UAN, unless higher-wage contribution is opted in." checked={draft.newJoinerExemption} onChange={(v) => set('newJoinerExemption', v)} />
    </UanDialog>
  );
};

const ClientDialog: React.FC<{ cfg: PfClientConfig; onClose: () => void; onSave: (flag: boolean) => void }> = ({ cfg, onClose, onSave }) => {
  const [flag, setFlag] = useState(cfg.higherWageDefault);
  return (
    <UanDialog title="Client PF configuration" subtitle={cfg.clientName} onClose={onClose} footer={<FooterButtons onClose={onClose} onSave={() => onSave(flag)} />}>
      <Check label="Higher-wage contribution opted in (client default)" hint="Candidates of this client who earn above the ceiling contribute on the actual basic wage, unless they have their own override." checked={flag} onChange={setFlag} />
    </UanDialog>
  );
};

const CandidateDialog: React.FC<{
  candidate: Candidate;
  record: PfCandidateRecord;
  rules: PfRules;
  basic: number;
  clientDefault: boolean;
  onClose: () => void;
  onSave: (v: Pick<PfCandidateRecord, 'oldUan' | 'newUan' | 'uanRegistered' | 'pfLinked' | 'override'>) => void;
}> = ({ candidate, record, rules, basic, clientDefault, onClose, onSave }) => {
  const [oldUan, setOldUan] = useState(record.oldUan);
  const [newUan, setNewUan] = useState(record.newUan);
  const [registered, setRegistered] = useState(record.uanRegistered);
  const [linked, setLinked] = useState(record.pfLinked);
  const [override, setOverride] = useState<PfOverride>(record.override);
  const [tried, setTried] = useState(false);

  const oldErr = oldUan && !UAN_RE.test(oldUan) ? 'Old UAN must be exactly 12 digits.' : '';
  const newErr = newUan && !UAN_RE.test(newUan) ? 'New UAN must be exactly 12 digits.' : '';
  const regErr = registered && !newUan ? 'Enter the new UAN to mark it registered.' : '';
  const linkErr = linked && !registered ? 'PF can only be linked once the UAN is registered.' : '';
  const sameErr = oldUan && newUan && oldUan === newUan ? 'Old and new UAN must be different.' : '';
  const errs = [oldErr, newErr, sameErr, regErr, linkErr].filter(Boolean);

  const optedIn = override === 'inherit' ? clientDefault : override === 'opted-in';
  const preview = resolvePfApplicability(basic, rules, optedIn, !!oldUan);
  const err = (m: string) => (tried && m ? <p className="text-[11px] mt-1 tone-bad tone-chip inline-block px-2 rounded">{m}</p> : null);

  return (
    <UanDialog title="Edit PF and UAN details" subtitle={`${candidate.firstName} ${candidate.lastName} (${candidate.userId}) - ${candidate.clientName}`} onClose={onClose} wide
      footer={<FooterButtons onClose={onClose} onSave={() => { setTried(true); if (!errs.length) onSave({ oldUan, newUan, uanRegistered: registered, pfLinked: linked, override }); }} />}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="cc-label" htmlFor="old-uan">Old UAN (previous employer)</label>
          <input id="old-uan" className="cc-input tabular-nums" inputMode="numeric" maxLength={12} placeholder="12 digits, optional" value={oldUan} onChange={(e) => setOldUan(e.target.value.replace(/\D/g, ''))} />
          {err(oldErr)}{err(sameErr)}
        </div>
        <div>
          <label className="cc-label" htmlFor="new-uan">New UAN</label>
          <input id="new-uan" className="cc-input tabular-nums" inputMode="numeric" maxLength={12} placeholder="12 digits" value={newUan} onChange={(e) => setNewUan(e.target.value.replace(/\D/g, ''))} />
          {err(newErr)}
        </div>
      </div>
      <div className="space-y-3">
        <Check label="UAN registered" hint="The new UAN has been generated and activated." checked={registered} onChange={(v) => { setRegistered(v); if (!v) setLinked(false); }} />
        {err(regErr)}
        <Check label="PF linked" hint="The UAN is linked to the employer's PF establishment." checked={linked} disabled={!registered} onChange={setLinked} />
        {err(linkErr)}
        <div className="flex items-center gap-2"><span className="cc-muted">Resulting status:</span><PfStatusChip registered={registered} linked={linked} /></div>
      </div>
      <div>
        <label className="cc-label">Higher-wage contribution (candidate override)</label>
        <SelectMenu className="cc-input" value={override} onChange={(e) => setOverride(e.target.value as PfOverride)} aria-label="Higher-wage override">
          <option value="inherit">Inherit client default ({clientDefault ? 'opted in' : 'not opted in'})</option>
          <option value="opted-in">Opted in</option>
          <option value="opted-out">Opted out</option>
        </SelectMenu>
      </div>
      <div className="cc-callout tone-info">
        <div>
          <strong className="cc-title">Applicability preview:</strong> <Chip tone={APPLICABILITY_TONE[preview.result]}>{preview.result}</Chip>
          <p className="cc-muted mt-1">Basic wage {inr(basic)}. {preview.note}</p>
        </div>
      </div>
    </UanDialog>
  );
};
