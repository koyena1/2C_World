import React, { useEffect, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { SectionCard } from '../../components/page/SectionCard';
import { useRole, useFeatureAccess } from '../../context/RoleContext';
import { useDocumentRules, setDocumentRules } from '../hr-ops/documentRulesStore';
import { DOCUMENT_SIZE_RULES, type DocumentSizeRule } from '../../data/mockDocumentRulesData';
import { formatAuditTime, logAudit, useAuditLog } from '../hr-ops/auditStore';
import { ViewOnlyNote } from './SettingsParts';

const ALL_FORMATS = ['PDF', 'JPG', 'PNG', 'DOCX', 'XLSX', 'CSV'];
const MAX_ALLOWED_MB = 25;

export const DocumentRulesSection: React.FC<{ onShowToast: (m: string) => void }> = ({ onShowToast }) => {
  const canEdit = useFeatureAccess('file-size') === 'manage';
  const { actor } = useRole();
  const saved = useDocumentRules();
  const [draft, setDraft] = useState<DocumentSizeRule[]>(saved);
  const [sizeText, setSizeText] = useState<Record<string, string>>({});
  useEffect(() => setDraft(saved), [saved]);

  const sizeOf = (r: DocumentSizeRule) => sizeText[r.id] ?? String(r.maxMb);
  const parse = (r: DocumentSizeRule) => Number(sizeOf(r));
  const errorOf = (r: DocumentSizeRule): string | null => {
    const n = parse(r);
    if (!Number.isFinite(n) || n <= 0) return 'Enter a size above 0 MB';
    if (n > MAX_ALLOWED_MB) return `Maximum is ${MAX_ALLOWED_MB} MB`;
    if (r.formats.length === 0) return 'Select at least one format';
    return null;
  };

  const withSizes = draft.map((r) => ({ ...r, maxMb: parse(r) }));
  const dirty = withSizes.some((r, i) => r.maxMb !== saved[i].maxMb || r.formats.join() !== saved[i].formats.join());
  const hasError = draft.some((r) => errorOf(r));

  const toggleFormat = (id: string, fmt: string) =>
    setDraft((d) =>
      d.map((r) => {
        if (r.id !== id) return r;
        const on = r.formats.includes(fmt);
        const next = on ? r.formats.filter((f) => f !== fmt) : ALL_FORMATS.filter((f) => f === fmt || r.formats.includes(f));
        return { ...r, formats: next };
      })
    );

  const save = () => {
    const changed = withSizes.filter((r, i) => r.maxMb !== saved[i].maxMb || r.formats.join() !== saved[i].formats.join());
    setDocumentRules(withSizes);
    setSizeText({});
    changed.forEach((r) =>
      logAudit({
        area: 'file-size',
        action: `${r.docType}: max ${r.maxMb} MB, formats ${r.formats.join('/')}`,
        subjectId: r.id,
        actorId: actor.id,
        actorName: actor.name,
      })
    );
    onShowToast(`Document rules saved (${changed.length} changed). Upload hints now show the new limits.`);
  };

  const reset = () => {
    setDraft(DOCUMENT_SIZE_RULES);
    setSizeText({});
  };

  const log = useAuditLog({ area: 'file-size' });

  return (
    <div className="cc-stack">
      {!canEdit && <ViewOnlyNote />}
      <SectionCard
        title="Allowed file size per document type"
        subtitle="Shown next to every upload control. Candidates and HR see the same limits."
        action={
          canEdit ? (
            <div className="flex gap-2">
              <button type="button" className="cc-btn cc-btn-secondary" onClick={reset}>
                <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Reset to defaults</span>
              </button>
              <button type="button" className="cc-btn cc-btn-primary" disabled={!dirty || hasError} onClick={save}>
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          ) : undefined
        }
      >
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr><th>Document type</th><th>Max size (MB)</th><th>Allowed formats</th></tr>
            </thead>
            <tbody>
              {draft.map((r) => {
                const err = errorOf(r);
                return (
                  <tr key={r.id}>
                    <td className="cc-title font-semibold whitespace-nowrap">{r.docType}</td>
                    <td>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={sizeOf(r)}
                        disabled={!canEdit}
                        aria-label={`Max size in MB for ${r.docType}`}
                        onChange={(e) => setSizeText((s) => ({ ...s, [r.id]: e.target.value }))}
                        className={`cc-input w-24 ${err && err.includes('MB') ? 'border-rose-500' : ''}`}
                      />
                      {err && <p className="text-[11px] mt-1 text-rose-600 dark:text-rose-400">{err}</p>}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_FORMATS.map((f) => {
                          const on = r.formats.includes(f);
                          return (
                            <button
                              key={f}
                              type="button"
                              disabled={!canEdit}
                              aria-pressed={on}
                              onClick={() => toggleFormat(r.id, f)}
                              className={`${on ? 'tone-info' : 'tone-muted'} tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold disabled:cursor-default ${on ? '' : 'opacity-60'}`}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Change log" subtitle="Who changed a document rule, and when.">
        {log.length === 0 ? (
          <p className="cc-muted text-xs">No changes in this session. Rules are at their configured defaults.</p>
        ) : (
          <ul className="cc-divide text-xs">
            {log.map((e) => (
              <li key={e.id} className="py-2 flex flex-wrap justify-between gap-x-4">
                <span className="cc-text">{e.action}</span>
                <span className="cc-muted">{e.actorName} · {formatAuditTime(e.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};
