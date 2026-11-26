import React, { useMemo, useState } from 'react';
import { Users, CheckCircle2, Clock, XCircle, Percent, Hourglass } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { KpiCard } from '../../components/page/KpiCard';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { SectionCard } from '../../components/page/SectionCard';
import { type DonutSlice } from '../../components/page/DonutChart';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Chip, ProgressBar } from '../dashboard/command-center/shared';
import { ShieldCheck } from 'lucide-react';
import {
  AGING_BUCKETS,
  KYC_DATA_FIELDS,
  KYC_DOC_TYPES,
  flattenKyc,
  type KycFlatRow,
} from '../../data/mockKycReportData';

interface KycDashboardViewProps {
  candidates: Candidate[];
}

const DOC_LABEL: Record<string, string> = {
  Aadhaar: 'Aadhaar (UIDAI)',
  PAN: 'PAN (NSDL)',
  Bank: 'Bank / Rs 1 (NPCI)',
  UAN: 'UAN (EPFO)',
};

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const count = (rows: KycFlatRow[], bucket: KycFlatRow['bucket']) => rows.filter((r) => r.bucket === bucket).length;

const RING_R = 40;
const RING_C = 2 * Math.PI * RING_R;
const SEGMENT_GAP = 2.5;

/** Compact ring + aligned legend for the KYC status mix: thin rounded segments with small gaps, total in the centre. */
const StatusDonut: React.FC<{ slices: DonutSlice[]; total: number }> = ({ slices, total }) => {
  let offset = 0;
  return (
    <div className="flex flex-col min-[420px]:flex-row items-center justify-center gap-3 sm:gap-5 w-full">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label="KYC status distribution">
          <circle cx="50" cy="50" r={RING_R} fill="none" strokeWidth="9" style={{ stroke: 'var(--cc-track)' }} />
          {total > 0 &&
            slices
              .filter((sl) => sl.count > 0)
              .map((sl) => {
                const full = (sl.count / total) * RING_C;
                const length = Math.max(full - SEGMENT_GAP, 0.5);
                const circle = (
                  <circle
                    key={sl.key}
                    cx="50"
                    cy="50"
                    r={RING_R}
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${length} ${RING_C - length}`}
                    strokeDashoffset={-(offset + SEGMENT_GAP / 2)}
                    style={{ stroke: `var(--cc-${sl.tone})` }}
                  />
                );
                offset += full;
                return circle;
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="cc-title text-xl font-bold leading-none tabular-nums">{total}</span>
          <span className="cc-muted text-[10px] font-semibold uppercase tracking-wide mt-1">checks</span>
        </div>
      </div>

      <ul className="w-full min-[420px]:w-auto min-[420px]:min-w-[11.5rem] flex flex-col gap-1.5 text-xs">
        {slices.map((sl) => (
          <li key={sl.key} className={`tone-${sl.tone} grid grid-cols-[auto_minmax(0,1fr)_auto_2.5rem] items-center gap-x-2`}>
            <span className="tone-fill w-2.5 h-2.5 rounded-full" />
            <span className="cc-text leading-tight">{sl.label}</span>
            <span className="cc-title font-bold tabular-nums text-right">{sl.count}</span>
            <span className="cc-muted tabular-nums text-right text-[11px]">{pct(sl.count, total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const KycDashboardView: React.FC<KycDashboardViewProps> = ({ candidates }) => {
  const [client, setClient] = useState('all');

  const clients = useMemo(() => Array.from(new Set(candidates.map((c) => c.clientName))).sort(), [candidates]);
  const scopeCandidates = useMemo(
    () => (client === 'all' ? candidates : candidates.filter((c) => c.clientName === client)),
    [candidates, client]
  );
  const rows = useMemo(() => flattenKyc(scopeCandidates), [scopeCandidates]);
  const allRows = useMemo(() => flattenKyc(candidates), [candidates]);

  const verified = count(rows, 'Verified');
  const pending = count(rows, 'Pending');
  const failed = count(rows, 'Failed');
  const skipped = count(rows, 'Skipped');
  const applicable = rows.length - skipped;
  const pendingRows = rows.filter((r) => r.bucket === 'Pending');
  const avgPendingAge = pendingRows.length ? Math.round((pendingRows.reduce((s, r) => s + r.ageDays, 0) / pendingRows.length) * 10) / 10 : 0;
  const fullyCleared = scopeCandidates.filter((c) => c.overallKycStatus === 'Verified' && c.pennyTestStatus === 'Verified').length;

  const kd = useKpiDetail<'candidates' | 'cleared' | 'rate' | 'pending' | 'failed' | 'age'>();
  const candCols = [
    { key: 'name', label: 'Candidate' },
    { key: 'uid', label: 'User ID', className: 'font-mono whitespace-nowrap' },
    { key: 'client', label: 'Client' },
    { key: 'kyc', label: 'KYC status' },
    { key: 'penny', label: 'Rs 1 status' },
  ];
  const candRow = (c: Candidate) => ({ name: `${c.firstName} ${c.lastName}`.trim(), uid: c.userId, client: c.clientName, kyc: c.overallKycStatus, penny: c.pennyTestStatus });
  const checkCols = [
    { key: 'name', label: 'Candidate' },
    { key: 'client', label: 'Client' },
    { key: 'doc', label: 'Document' },
    { key: 'status', label: 'Status' },
    { key: 'age', label: 'Age', align: 'right' as const },
    { key: 'upd', label: 'Last updated', className: 'whitespace-nowrap' },
  ];
  const checkRow = (r: KycFlatRow) => ({
    name: r.candidateName,
    client: r.clientName,
    doc: r.docType,
    status: <Chip tone={r.bucket === 'Verified' ? 'good' : r.bucket === 'Failed' ? 'bad' : r.bucket === 'Pending' ? 'warn' : 'muted'}>{r.rawStatus}</Chip>,
    age: `${r.ageDays}d`,
    upd: r.lastUpdated,
  });
  const detail: KpiDetailData | null = !kd.activeId
    ? null
    : kd.activeId === 'candidates'
      ? { title: 'Candidates in scope', columns: candCols, rows: scopeCandidates.map(candRow) }
      : kd.activeId === 'cleared'
        ? { title: 'Fully Cleared', columns: candCols, rows: scopeCandidates.filter((c) => c.overallKycStatus === 'Verified' && c.pennyTestStatus === 'Verified').map(candRow) }
        : kd.activeId === 'rate'
          ? {
              title: 'Verification Rate: checks per document',
              subtitle: `${verified} of ${applicable} applicable checks verified (${pct(verified, applicable)}%)`,
              columns: [
                { key: 'doc', label: 'Document' },
                { key: 'ver', label: 'Verified', align: 'right' },
                { key: 'app', label: 'Applicable', align: 'right' },
                { key: 'rate', label: 'Rate', align: 'right' },
              ],
              rows: KYC_DOC_TYPES.map((doc) => {
                const d = rows.filter((r) => r.docType === doc);
                const app = d.filter((r) => r.bucket !== 'Skipped').length;
                const ver = count(d, 'Verified');
                return { doc: DOC_LABEL[doc], ver, app, rate: `${pct(ver, app)}%` };
              }),
            }
          : kd.activeId === 'pending'
            ? { title: 'Pending checks', columns: checkCols, rows: rows.filter((r) => r.bucket === 'Pending').map(checkRow) }
            : kd.activeId === 'failed'
              ? { title: 'Failed checks', columns: checkCols, rows: rows.filter((r) => r.bucket === 'Failed').map(checkRow) }
              : { title: 'Pending checks by age', subtitle: `Average ${avgPendingAge} days since last update`, columns: checkCols, rows: [...pendingRows].sort((a, b) => b.ageDays - a.ageDays).map(checkRow) };

  const slices: DonutSlice[] = [
    { key: 'verified', label: 'Verified', count: verified, tone: 'good' },
    { key: 'pending', label: 'Pending / manual review', count: pending, tone: 'warn' },
    { key: 'failed', label: 'Failed / rejected', count: failed, tone: 'bad' },
    { key: 'skipped', label: 'Skipped', count: skipped, tone: 'muted' },
  ];

  // Per document-type funnel: candidates in scope -> submitted -> verified
  const funnel = KYC_DOC_TYPES.map((doc) => {
    const docRows = rows.filter((r) => r.docType === doc);
    const submitted = docRows.filter((r) => r.rawStatus !== 'Not Started' && r.bucket !== 'Skipped').length;
    return {
      doc,
      total: scopeCandidates.length,
      submitted,
      verified: count(docRows, 'Verified'),
      failed: count(docRows, 'Failed'),
    };
  });

  // Client-wise "central set" (always across the clients in scope)
  const clientRows = useMemo(() => {
    const names = client === 'all' ? clients : [client];
    return names
      .map((name) => {
        const r = allRows.filter((x) => x.clientName === name);
        const cands = candidates.filter((c) => c.clientName === name);
        return {
          name,
          candidates: cands.length,
          total: r.length,
          verified: count(r, 'Verified'),
          pending: count(r, 'Pending'),
          failed: count(r, 'Failed'),
          cleared: cands.filter((c) => c.overallKycStatus === 'Verified' && c.pennyTestStatus === 'Verified').length,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [client, clients, allRows, candidates]);

  const aging = AGING_BUCKETS.map((b) => ({
    ...b,
    count: pendingRows.filter((r) => r.ageDays >= b.min && r.ageDays <= b.max).length,
  }));
  const maxAging = Math.max(1, ...aging.map((a) => a.count));
  const oldest = [...pendingRows].sort((a, b) => b.ageDays - a.ageDays).slice(0, 5);

  const fieldRows = KYC_DATA_FIELDS.map((f) => {
    const populated = rows.filter(f.test).length;
    return { ...f, populated, missing: rows.length - populated, rate: pct(populated, rows.length) };
  });

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="KYC Verification Dashboard"
        subtitle="Central set: consolidated KYC status across all clients and document types"
        actions={
          <div className="w-56 max-w-full">
            <SelectMenu value={client} onChange={(e) => setClient(e.target.value)} className="cc-input" aria-label="Client scope">
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectMenu>
          </div>
        }
      />
      <PageBody>
        <div className="cc-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard onClick={() => kd.toggle('candidates')} active={kd.isActive('candidates')} label="Candidates" value={scopeCandidates.length} detail={`${rows.length} KYC checks`} icon={Users} tone="info" />
          <KpiCard onClick={() => kd.toggle('cleared')} active={kd.isActive('cleared')} label="Fully Cleared" value={fullyCleared} detail="KYC and Rs 1 verified" icon={CheckCircle2} tone="good" />
          <KpiCard onClick={() => kd.toggle('rate')} active={kd.isActive('rate')} label="Verification Rate" value={`${pct(verified, applicable)}%`} detail={`${verified} of ${applicable} checks`} icon={Percent} tone="teal" />
          <KpiCard onClick={() => kd.toggle('pending')} active={kd.isActive('pending')} label="Pending" value={pending} detail="Awaiting review / input" icon={Clock} tone="warn" />
          <KpiCard onClick={() => kd.toggle('failed')} active={kd.isActive('failed')} label="Failed" value={failed} detail="Mismatch or rejected" icon={XCircle} tone="bad" />
          <KpiCard onClick={() => kd.toggle('age')} active={kd.isActive('age')} label="Avg Pending Age" value={`${avgPendingAge}d`} detail="Since last update" icon={Hourglass} tone="violet" />
        </div>
        <KpiDetailPanel detail={detail} onClose={kd.close} />

        <div className="cc-grid grid-cols-1 lg:grid-cols-5">
          <SectionCard title="Status Distribution" className="lg:col-span-2" subtitle="All KYC checks in scope">
            {/* centred in whatever height the row has, so the card stays compact beside the funnel */}
            <div className="flex-1 flex items-center">
              <StatusDonut slices={slices} total={rows.length} />
            </div>
          </SectionCard>

          <SectionCard title="Verification Funnel by Document" subtitle="Candidates in scope, submitted, verified" className="lg:col-span-3">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
              {funnel.map((f) => {
                const submittedPct = pct(f.submitted, f.total);
                const verifiedPct = pct(f.verified, f.total);
                return (
                  <li key={f.doc} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="cc-title text-xs font-semibold">{DOC_LABEL[f.doc]}</span>
                      <span className="tone-good tone-text text-xs font-bold tabular-nums">{verifiedPct}% verified</span>
                    </div>
                    {/* one bar: track = all candidates, light fill = submitted, solid fill = verified */}
                    <div
                      className="cc-track relative h-2 rounded-full overflow-hidden mt-1.5"
                      role="img"
                      aria-label={`${DOC_LABEL[f.doc]}: ${f.submitted} of ${f.total} submitted, ${f.verified} verified${f.failed ? `, ${f.failed} failed` : ''}`}
                    >
                      <div className="tone-info tone-fill absolute inset-y-0 left-0 rounded-full opacity-45 transition-[width] duration-500" style={{ width: `${submittedPct}%` }} />
                      <div className="tone-good tone-fill absolute inset-y-0 left-0 rounded-full transition-[width] duration-500" style={{ width: `${verifiedPct}%` }} />
                    </div>
                    <p className="cc-muted text-[11px] mt-1 tabular-nums">
                      {f.submitted}/{f.total} submitted · {f.verified} verified
                      {f.failed ? <span className="tone-bad tone-text font-semibold"> · {f.failed} failed</span> : null}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-x-4 gap-y-1 text-[11px] cc-muted flex-wrap mt-3 pt-2.5 border-t border-[color:var(--cc-divider)]">
              <span className="tone-muted inline-flex items-center gap-1.5"><span className="cc-track w-2.5 h-2 rounded-full border border-[color:var(--cc-card-border)]" />Candidates</span>
              <span className="tone-info inline-flex items-center gap-1.5"><span className="tone-fill w-2.5 h-2 rounded-full opacity-45" />Submitted</span>
              <span className="tone-good inline-flex items-center gap-1.5"><span className="tone-fill w-2.5 h-2 rounded-full" />Verified</span>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Client-wise Central Set" subtitle="Totals per client with verification progress">
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="text-right">Candidates</th>
                  <th className="text-right">Checks</th>
                  <th className="text-right">Verified</th>
                  <th className="text-right">Pending</th>
                  <th className="text-right">Failed</th>
                  <th className="text-right">Cleared</th>
                  <th className="min-w-[160px]">Progress</th>
                </tr>
              </thead>
              <tbody>
                {clientRows.map((c) => {
                  const rate = pct(c.verified, c.total);
                  return (
                    <tr key={c.name}>
                      <td className="font-semibold cc-title whitespace-nowrap">{c.name}</td>
                      <td className="text-right tabular-nums">{c.candidates}</td>
                      <td className="text-right tabular-nums">{c.total}</td>
                      <td className="text-right tabular-nums tone-good tone-text font-semibold">{c.verified}</td>
                      <td className="text-right tabular-nums tone-warn tone-text font-semibold">{c.pending}</td>
                      <td className="text-right tabular-nums tone-bad tone-text font-semibold">{c.failed}</td>
                      <td className="text-right tabular-nums">{c.cleared}/{c.candidates}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={rate} tone={rate >= 80 ? 'good' : rate >= 50 ? 'warn' : 'bad'} className="flex-1" label={`${c.name} verified`} />
                          <span className="tabular-nums w-9 text-right">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="cc-grid grid-cols-1 lg:grid-cols-2">
          <SectionCard title="Aging of Pending Items" subtitle="Days since last update (as of 5 Oct 2026)">
            <div className="space-y-3">
              {aging.map((a, i) => (
                <div key={a.key} className="flex items-center gap-3 text-xs">
                  <span className="w-20 shrink-0 cc-muted">{a.label}</span>
                  <ProgressBar value={(a.count / maxAging) * 100} tone={i === 0 ? 'info' : i === 1 ? 'teal' : i === 2 ? 'warn' : 'bad'} className="flex-1" label={a.label} />
                  <span className="w-6 text-right tabular-nums cc-title font-semibold">{a.count}</span>
                </div>
              ))}
            </div>
            <div className="cc-table-wrap mt-4">
              <table className="cc-table">
                <thead>
                  <tr><th>Oldest pending</th><th>Document</th><th className="text-right">Days</th></tr>
                </thead>
                <tbody>
                  {oldest.map((r) => (
                    <tr key={r.key}>
                      <td className="whitespace-nowrap"><span className="cc-title font-semibold">{r.candidateName}</span><span className="cc-muted block text-[11px]">{r.clientName}</span></td>
                      <td>{r.docType}</td>
                      <td className="text-right tabular-nums"><Chip tone={r.ageDays >= 15 ? 'bad' : r.ageDays >= 8 ? 'warn' : 'info'}>{r.ageDays}d</Chip></td>
                    </tr>
                  ))}
                  {oldest.length === 0 && (
                    <tr><td colSpan={3} className="cc-muted text-center py-4">No pending items in scope.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="KYC Data Fields" subtitle="Completeness of captured data per field">
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr><th>Field</th><th>Source</th><th className="text-right">Filled</th><th className="text-right">Missing</th><th className="min-w-[110px]">Completeness</th></tr>
                </thead>
                <tbody>
                  {fieldRows.map((f) => (
                    <tr key={f.id}>
                      <td className="cc-title font-semibold">{f.label}</td>
                      <td className="cc-muted">{f.source}</td>
                      <td className="text-right tabular-nums">{f.populated}</td>
                      <td className="text-right tabular-nums">{f.missing}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={f.rate} tone={f.rate >= 80 ? 'good' : f.rate >= 40 ? 'warn' : 'bad'} className="flex-1" label={f.label} />
                          <span className="tabular-nums w-9 text-right">{f.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </PageBody>
    </>
  );
};
