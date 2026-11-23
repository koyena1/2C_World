import React, { useMemo, useRef, useState } from 'react';
import { Save, Sparkles, FileText, Eye } from 'lucide-react';
import { MOCK_CANDIDATES } from '../../data/mockOnboardingData';
import {
  LETTER_TEMPLATES,
  LETTER_VARIABLES,
  VARIABLE_GROUPS,
  type LetterTemplate,
} from '../../data/mockLetterBuilderData';
import { useSignature } from '../../data/mockSignatureData';
import { useIsSignatureEnabled } from '../hr-ops/clientFeatureStore';
import { logAudit, useAuditLog, formatAuditTime } from '../hr-ops/auditStore';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { SectionCard } from '../../components/page/SectionCard';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import { LetterDocument } from './SignatureUploadPanel';

const SEED_HISTORY = LETTER_TEMPLATES.map((t) => ({ id: `seed-${t.id}`, text: `${t.name} template saved`, by: t.updatedBy, at: t.updatedAt }));

export const LetterBuilderPanel: React.FC = () => {
  const access = useFeatureAccess('letter-variables');
  const { actor } = useRole();
  const readOnly = access !== 'manage';
  const { message, showToast } = useToast(3000);

  const [templates, setTemplates] = useState<LetterTemplate[]>(LETTER_TEMPLATES);
  const [activeId, setActiveId] = useState(LETTER_TEMPLATES[0].id);
  const [draft, setDraft] = useState(LETTER_TEMPLATES[0].body);
  const [candidateId, setCandidateId] = useState(MOCK_CANDIDATES[0].id);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const active = templates.find((t) => t.id === activeId) ?? templates[0];
  const candidate = MOCK_CANDIDATES.find((c) => c.id === candidateId) ?? MOCK_CANDIDATES[0];
  const dirty = draft !== active.body;
  const sig = useSignature(candidate.id);
  const sigEnabled = useIsSignatureEnabled(candidate.clientName);
  const audit = useAuditLog({ area: 'letter-variables' });

  const unresolved = useMemo(() => {
    const keys = Array.from(new Set(Array.from(draft.matchAll(/\{\{\s*(\w+)\s*\}\}/g)).map((m) => m[1])));
    return keys.filter((k) => !LETTER_VARIABLES.find((v) => v.key === k)?.resolve(candidate));
  }, [draft, candidate]);

  const selectTemplate = (t: LetterTemplate) => {
    if (t.id === activeId) return;
    if (dirty && !window.confirm('Discard unsaved changes to this template?')) return;
    setActiveId(t.id);
    setDraft(t.body);
  };

  const insertVariable = (key: string) => {
    if (readOnly) return;
    const token = `{{${key}}}`;
    const ta = taRef.current;
    const focused = ta && document.activeElement === ta;
    const start = focused ? ta.selectionStart : draft.length;
    const end = focused ? ta.selectionEnd : draft.length;
    setDraft(draft.slice(0, start) + token + draft.slice(end));
    requestAnimationFrame(() => {
      ta?.focus();
      const pos = start + token.length;
      ta?.setSelectionRange(pos, pos);
    });
  };

  const save = () => {
    if (readOnly || !dirty) return;
    const now = new Date().toISOString();
    setTemplates((prev) => prev.map((t) => (t.id === active.id ? { ...t, body: draft, updatedBy: actor.name, updatedAt: now } : t)));
    logAudit({ area: 'letter-variables', action: `Saved ${active.name} template`, subjectId: active.id, actorId: actor.id, actorName: actor.name });
    showToast(`${active.name} template saved`);
  };

  const history = [
    ...audit.map((e) => ({ id: e.id, text: e.action, by: e.actorName, at: e.at })),
    ...SEED_HISTORY,
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="cc-stack">
      <Toast message={message} variant="solid" accent="purple" />
      {readOnly && <p className="cc-muted text-xs">View only: your role can preview templates but not edit or save them.</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4 min-w-0">
          <SectionCard title="Letter templates" subtitle="Pick a template to edit">
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTemplate(t)}
                  aria-pressed={t.id === activeId}
                  className={cn('cc-btn', t.id === activeId ? 'cc-btn-primary' : 'cc-btn-secondary')}
                >
                  <FileText className="w-3.5 h-3.5" /> {t.name}
                </button>
              ))}
            </div>
            <p className="cc-muted text-[11px] mt-2">Last saved by {active.updatedBy}, {formatAuditTime(active.updatedAt)}</p>
          </SectionCard>

          <SectionCard
            title={`Edit: ${active.name}`}
            subtitle="Click a variable below to insert it at the cursor"
            action={
              <button type="button" className="cc-btn cc-btn-primary" disabled={readOnly || !dirty} onClick={save}>
                <Save className="w-3.5 h-3.5" /> Save template
              </button>
            }
          >
            <textarea
              ref={taRef}
              value={draft}
              readOnly={readOnly}
              onChange={(e) => setDraft(e.target.value)}
              rows={12}
              aria-label="Template body"
              className="cc-input w-full h-72 font-mono text-xs leading-relaxed"
            />
            {dirty && <p className="tone-warn tone-text text-[11px] mt-1">Unsaved changes</p>}
          </SectionCard>

          <SectionCard title="Variable parameters" subtitle="Available merge fields, grouped">
            <div className="space-y-3">
              {VARIABLE_GROUPS.map((g) => (
                <div key={g}>
                  <p className="cc-muted text-[11px] font-semibold uppercase tracking-wide mb-1.5">{g}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LETTER_VARIABLES.filter((v) => v.group === g).map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        disabled={readOnly}
                        onClick={() => insertVariable(v.key)}
                        title={`Insert {{${v.key}}}`}
                        className={cn('cc-btn cc-btn-secondary text-xs', v.isNew && 'ring-2 ring-emerald-500/60')}
                      >
                        <span>{v.label}</span>
                        <code className="cc-muted text-[10px]">{`{{${v.key}}}`}</code>
                        {v.isNew && (
                          <span className="tone-good tone-chip text-[10px] px-1.5 rounded-full inline-flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> New
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4 min-w-0">
          <SectionCard
            title="Live preview"
            subtitle="Rendered with a real candidate's data"
            action={<Eye className="w-4 h-4 cc-muted" />}
          >
            <label className="cc-muted text-[11px] block mb-1" htmlFor="lb-candidate">Sample candidate</label>
            <SelectMenu id="lb-candidate" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} className="cc-input w-full mb-3">
              {MOCK_CANDIDATES.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.clientName}</option>
              ))}
            </SelectMenu>
            {unresolved.length > 0 && (
              <p role="status" className="tone-bad tone-text text-xs mb-2">
                Unresolved for this candidate: {unresolved.map((k) => `{{${k}}}`).join(', ')}
                {unresolved.includes('last_working_day') && ' (no contract end date on file, so no LWD yet)'}
              </p>
            )}
            <LetterDocument
              title={active.name}
              body={draft}
              candidate={candidate}
              signatureUrl={sigEnabled ? sig?.imageUrl : undefined}
              signatureNote={sigEnabled ? 'This employee has not uploaded a signature yet.' : `Signature feature is not enabled for ${candidate.clientName}.`}
            />
          </SectionCard>

          <SectionCard title="Change history" subtitle="Template saves (letter-variables)">
            <ul className="cc-divide">
              {history.map((h) => (
                <li key={h.id} className="cc-row py-2 text-xs flex flex-wrap justify-between gap-x-3">
                  <span className="cc-title">{h.text}</span>
                  <span className="cc-muted">{h.by}, {formatAuditTime(h.at)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
