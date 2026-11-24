import React, { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, Trash2, UserPlus, Eye, Save } from 'lucide-react';
import { SectionCard } from '../../components/page/SectionCard';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { useRole, useFeatureAccess } from '../../context/RoleContext';
import { ROLES, ROLE_LABELS, type AppRole } from '../hr-ops/hrOps.config';
import {
  EXPORT_FIELDS,
  EXPORT_FIELD_GROUPS,
  getAllowedExportFields,
  roleOfSystemRole,
  setRoleExportFields,
  setUserExportOverride,
  useExportPolicy,
} from '../hr-ops/exportPolicyStore';
import { formatAuditTime } from '../hr-ops/auditStore';
import { MOCK_USERS } from '../../data/mockUserSettingsData';
import { MOCK_CANDIDATES } from '../../data/mockOnboardingData';
import { ViewOnlyNote } from './SettingsParts';

const roleOfUser = roleOfSystemRole;

type Target = { kind: 'role'; role: AppRole } | { kind: 'user'; userId: string };

const FieldChecklist: React.FC<{
  selected: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}> = ({ selected, onChange, disabled }) => {
  const set = new Set(selected);
  const toggle = (id: string) => onChange(set.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {EXPORT_FIELD_GROUPS.map((group) => {
        const fields = EXPORT_FIELDS.filter((f) => f.group === group);
        const allOn = fields.every((f) => set.has(f.id));
        return (
          <div key={group} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="cc-title text-xs font-bold">{group}</span>
              <button
                type="button"
                disabled={disabled}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 disabled:opacity-50"
                onClick={() => {
                  const ids = new Set(fields.map((f) => f.id));
                  onChange(allOn ? selected.filter((x) => !ids.has(x)) : [...new Set([...selected, ...ids])]);
                }}
              >
                {allOn ? 'Clear' : 'Select all'}
              </button>
            </div>
            <ul className="space-y-1.5">
              {fields.map((f) => (
                <li key={f.id}>
                  <label className="flex items-center gap-2 text-xs cursor-pointer min-h-6">
                    <input type="checkbox" checked={set.has(f.id)} disabled={disabled} onChange={() => toggle(f.id)} className="w-4 h-4 accent-sky-600" />
                    <span className="cc-text">{f.label}</span>
                    {f.sensitive && (
                      <span className="tone-warn tone-chip inline-flex items-center gap-0.5 px-1.5 rounded text-[10px] font-semibold">
                        <ShieldAlert className="w-3 h-3" /> Sensitive
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export const ExportPermissionsSection: React.FC<{ onShowToast: (m: string) => void }> = ({ onShowToast }) => {
  const access = useFeatureAccess('ob-export');
  const canEdit = access === 'manage';
  const { actor } = useRole();
  const policy = useExportPolicy();

  const [target, setTarget] = useState<Target>({ kind: 'role', role: 'hr' });
  const savedFields = target.kind === 'role' ? policy.roles[target.role] : policy.userOverrides[target.userId] ?? [];
  const [draft, setDraft] = useState<string[]>(savedFields);
  const targetKey = target.kind === 'role' ? `role:${target.role}` : `user:${target.userId}`;
  useEffect(() => setDraft(savedFields), [targetKey, savedFields]);

  const dirty = draft.length !== savedFields.length || draft.some((d) => !savedFields.includes(d));
  const lastChange = policy.changes.find((c) => c.key === targetKey);

  const overrideUsers = Object.keys(policy.userOverrides);
  const addableUsers = MOCK_USERS.filter((u) => !overrideUsers.includes(u.id));
  const [newUserId, setNewUserId] = useState(addableUsers[0]?.id ?? '');

  const [previewUserId, setPreviewUserId] = useState('usr-6');
  const previewUser = MOCK_USERS.find((u) => u.id === previewUserId) ?? MOCK_USERS[0];
  const previewRole = roleOfUser(previewUser.role);
  const hasOverride = Boolean(policy.userOverrides[previewUser.id]);
  const effective = useMemo(
    () => new Set(getAllowedExportFields(previewRole, previewUser.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewRole, previewUser.id, policy]
  );

  const targetLabel = target.kind === 'role' ? `${ROLE_LABELS[target.role]} role` : MOCK_USERS.find((u) => u.id === target.userId)?.name ?? target.userId;

  const save = () => {
    if (target.kind === 'role') setRoleExportFields(target.role, draft, actor);
    else setUserExportOverride(target.userId, draft, actor);
    onShowToast(`Export permissions saved for ${targetLabel}${draft.length === 0 ? ' (export disabled)' : ''}.`);
  };

  const addOverride = () => {
    const u = MOCK_USERS.find((x) => x.id === newUserId);
    if (!u) return;
    setUserExportOverride(u.id, [...getAllowedExportFields(roleOfUser(u.role))], actor);
    setTarget({ kind: 'user', userId: u.id });
    setNewUserId(addableUsers.find((x) => x.id !== u.id)?.id ?? '');
    onShowToast(`User-specific override created for ${u.name}. Adjust the fields and save.`);
  };

  const removeOverride = (userId: string) => {
    const u = MOCK_USERS.find((x) => x.id === userId);
    setUserExportOverride(userId, null, actor);
    if (target.kind === 'user' && target.userId === userId) setTarget({ kind: 'role', role: 'hr' });
    onShowToast(`Override removed for ${u?.name ?? userId}. Role defaults apply again.`);
  };

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const sensitiveCount = EXPORT_FIELDS.filter((f) => f.sensitive).length;
  const previewFields = EXPORT_FIELDS.filter((f) => effective.has(f.id));
  const blockedFields = EXPORT_FIELDS.filter((f) => !effective.has(f.id));

  const overview = [
    {
      n: 1,
      id: 'ob-roles',
      title: 'Role-Based Export Access',
      text: 'Decide who may export: by role (Admin, HR, HRBP) or for one specific User ID.',
      status: `${ROLES.length} roles · ${overrideUsers.length} user-specific override${overrideUsers.length === 1 ? '' : 's'}`,
    },
    {
      n: 2,
      id: 'ob-fields',
      title: 'Field-Level Restrictions',
      text: 'Tick the exact fields each role or user may export. Anything not ticked is blocked.',
      status: ROLES.map((r) => `${ROLE_LABELS[r]} ${policy.roles[r].length}/${EXPORT_FIELDS.length}`).join(' · '),
    },
    {
      n: 3,
      id: 'ob-protection',
      title: 'Restricted Data Protection',
      text: 'Unauthorised and sensitive fields are left out of the downloaded file. See exactly what a user gets.',
      status: `${sensitiveCount} sensitive fields protected`,
    },
  ];

  return (
    <div className="cc-stack">
      {!canEdit && <ViewOnlyNote />}

      <SectionCard
        title="OB Data Export – Role-Based Access Control"
        subtitle="Controls who can export onboarding data from the Candidate Directory (and the other Export CSV buttons), and which fields end up in the file."
      >
        <ol className="grid gap-3 md:grid-cols-3">
          {overview.map((o) => (
            <li key={o.n}>
              <button
                type="button"
                onClick={() => goTo(o.id)}
                className="cc-card cc-card-hover w-full h-full text-left p-3.5 flex flex-col gap-1.5"
              >
                <span className="flex items-center gap-2">
                  <span className="cc-accent-chip w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums">{o.n}</span>
                  <span className="cc-title text-sm font-bold">{o.title}</span>
                </span>
                <span className="cc-muted text-xs">{o.text}</span>
                <span className="cc-accent text-[11px] font-semibold mt-auto">{o.status}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="cc-muted text-[11px] mt-3">
          Where it applies: Candidate Pipeline → Candidate Directory → Export CSV. The export dialog shows which fields are included and which are excluded.
        </p>
      </SectionCard>

      <div id="ob-roles" className="scroll-mt-4">
        <SectionCard
          step={1}
          title="Role-Based Export Access"
          subtitle="Pick a role, or a specific user, to set what they can export. A user-specific permission always wins over the role."
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTarget({ kind: 'role', role: r })}
                className={`cc-tab ${target.kind === 'role' && target.role === r ? 'cc-tab-active' : ''}`}
                aria-pressed={target.kind === 'role' && target.role === r}
              >
                {ROLE_LABELS[r]} ({policy.roles[r].length})
              </button>
            ))}
            {overrideUsers.map((id) => {
              const u = MOCK_USERS.find((x) => x.id === id);
              const active = target.kind === 'user' && target.userId === id;
              return (
                <button key={id} type="button" onClick={() => setTarget({ kind: 'user', userId: id })} className={`cc-tab ${active ? 'cc-tab-active' : ''}`} aria-pressed={active}>
                  {u?.name ?? id} (user)
                </button>
              );
            })}
          </div>

          <p className="cc-title text-xs font-bold mb-1.5">Specific User ID</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-72">
              <SelectMenu value={newUserId} onChange={(e) => setNewUserId(e.target.value)} disabled={!canEdit || addableUsers.length === 0} aria-label="User for override">
                {addableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </SelectMenu>
            </div>
            <button type="button" className="cc-btn cc-btn-primary" disabled={!canEdit || !newUserId} onClick={addOverride}>
              <UserPlus className="w-3.5 h-3.5" /> Add user-specific access
            </button>
          </div>
          {overrideUsers.length > 0 && (
            <div className="cc-table-wrap mt-3">
              <table className="cc-table">
                <thead>
                  <tr><th>User</th><th>Base role</th><th>Fields allowed</th><th>Last changed</th><th /></tr>
                </thead>
                <tbody>
                  {overrideUsers.map((id) => {
                    const u = MOCK_USERS.find((x) => x.id === id);
                    const ch = policy.changes.find((c) => c.key === `user:${id}`);
                    return (
                      <tr key={id}>
                        <td className="cc-title font-semibold">{u?.name ?? id}<span className="cc-muted block text-[11px] font-normal">{id}</span></td>
                        <td>{u?.role}</td>
                        <td>{policy.userOverrides[id].length} of {EXPORT_FIELDS.length}</td>
                        <td className="cc-muted">{ch ? `${ch.by}, ${formatAuditTime(ch.at)}` : '-'}</td>
                        <td className="text-right whitespace-nowrap">
                          <button type="button" className="cc-btn cc-btn-secondary" onClick={() => { setTarget({ kind: 'user', userId: id }); goTo('ob-fields'); }}>Edit fields</button>{' '}
                          <button type="button" className="cc-btn cc-btn-secondary" disabled={!canEdit} onClick={() => removeOverride(id)} aria-label={`Remove override for ${u?.name}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div id="ob-fields" className="scroll-mt-4">
        <SectionCard
          step={2}
          title="Field-Level Restrictions"
          subtitle="Tick the fields this role or user is authorised to export. Fields that are not ticked are blocked."
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="cc-text text-xs">
              Editing <strong>{targetLabel}</strong> · {draft.length} of {EXPORT_FIELDS.length} fields allowed
              {draft.length === 0 && <span className="tone-bad tone-chip ml-2 px-2 py-0.5 rounded-md text-[11px] font-semibold">Export disabled</span>}
            </p>
            <div className="flex gap-2">
              {target.kind === 'user' && (
                <button type="button" className="cc-btn cc-btn-secondary" disabled={!canEdit} onClick={() => removeOverride(target.userId)}>
                  <Trash2 className="w-3.5 h-3.5" /> Remove user-specific access
                </button>
              )}
              <button type="button" className="cc-btn cc-btn-primary" disabled={!canEdit || !dirty} onClick={save}>
                <Save className="w-3.5 h-3.5" /> Save changes
              </button>
            </div>
          </div>

          <FieldChecklist selected={draft} onChange={setDraft} disabled={!canEdit} />

          <p className="cc-muted text-[11px] mt-3">
            {lastChange
              ? `Last changed by ${lastChange.by} on ${formatAuditTime(lastChange.at)}: ${lastChange.note}.`
              : 'No changes recorded yet for this target.'}
          </p>
        </SectionCard>
      </div>

      <div id="ob-protection" className="scroll-mt-4">
        <SectionCard
          step={3}
          title="Restricted Data Protection"
          subtitle="Choose a user to see what they can export. Red fields are removed from their file."
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="w-full sm:w-72">
              <SelectMenu value={previewUserId} onChange={(e) => setPreviewUserId(e.target.value)} aria-label="Preview user">
                {MOCK_USERS.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </SelectMenu>
            </div>
            <span className="cc-muted text-[11px] inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Source: {hasOverride ? 'user-specific access' : `${ROLE_LABELS[previewRole]} role default`} · {effective.size} allowed, {EXPORT_FIELDS.length - effective.size} blocked
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {EXPORT_FIELD_GROUPS.map((g) => (
              <div key={g}>
                <p className="cc-title text-[11px] font-bold uppercase tracking-wide mb-1">{g}</p>
                <div className="flex flex-wrap gap-1">
                  {EXPORT_FIELDS.filter((f) => f.group === g).map((f) => (
                    <span key={f.id} className={`${effective.has(f.id) ? 'tone-good' : 'tone-bad'} tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold ${effective.has(f.id) ? '' : 'line-through'}`}>
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="cc-title text-xs font-bold mt-4 mb-1.5">
            Sample of the file {previewUser.name} would download (first 3 candidates)
          </p>
          {previewFields.length === 0 ? (
            <p className="tone-bad tone-chip rounded-lg px-3 py-2 text-xs font-semibold">Export is disabled for this user: no file can be downloaded.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-[11px]">
                <thead className="cc-muted">
                  <tr>{previewFields.map((f) => <th key={f.id} className="px-2 py-1.5 font-semibold whitespace-nowrap">{f.label}</th>)}</tr>
                </thead>
                <tbody className="cc-divide">
                  {MOCK_CANDIDATES.slice(0, 3).map((c) => (
                    <tr key={c.id}>{previewFields.map((f) => <td key={f.id} className="px-2 py-1.5 whitespace-nowrap cc-text">{f.value(c) || '-'}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {blockedFields.length > 0 && (
            <p className="cc-muted text-[11px] mt-2">
              Not in the file ({blockedFields.length}): {blockedFields.map((f) => f.label).join(', ')}.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Change history" subtitle="Who changed export permissions, and when.">
        <ul className="cc-divide text-xs">
          {policy.changes.slice(0, 8).map((c, i) => (
            <li key={`${c.key}-${c.at}-${i}`} className="py-2 flex flex-wrap justify-between gap-x-4">
              <span className="cc-text">{c.note}</span>
              <span className="cc-muted">{c.by} · {formatAuditTime(c.at)}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
};
