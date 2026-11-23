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
  setRoleExportFields,
  setUserExportOverride,
  useExportPolicy,
} from '../hr-ops/exportPolicyStore';
import { formatAuditTime } from '../hr-ops/auditStore';
import { MOCK_USERS } from '../../data/mockUserSettingsData';
import { ViewOnlyNote } from './SettingsParts';

const roleOfUser = (systemRole: string): AppRole =>
  systemRole === 'Super Admin' || systemRole === 'Admin' ? 'admin' : systemRole.startsWith('HR') ? 'hr' : 'hrbp';

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

  return (
    <div className="cc-stack">
      {!canEdit && <ViewOnlyNote />}

      <SectionCard
        title="Export permissions"
        subtitle="Choose who can export candidate data and which fields. Fields not ticked are excluded from the exported file."
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

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="cc-text text-xs">
            Editing <strong>{targetLabel}</strong> · {draft.length} of {EXPORT_FIELDS.length} fields allowed
            {draft.length === 0 && <span className="tone-bad tone-chip ml-2 px-2 py-0.5 rounded-md text-[11px] font-semibold">Export disabled</span>}
          </p>
          <div className="flex gap-2">
            {target.kind === 'user' && (
              <button type="button" className="cc-btn cc-btn-secondary" disabled={!canEdit} onClick={() => removeOverride(target.userId)}>
                <Trash2 className="w-3.5 h-3.5" /> Remove override
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

      <SectionCard title="User-specific override" subtitle="Give one user a different field list than their role (for example payroll needing bank fields).">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-72">
            <SelectMenu value={newUserId} onChange={(e) => setNewUserId(e.target.value)} disabled={!canEdit || addableUsers.length === 0} aria-label="User for override">
              {addableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </SelectMenu>
          </div>
          <button type="button" className="cc-btn cc-btn-primary" disabled={!canEdit || !newUserId} onClick={addOverride}>
            <UserPlus className="w-3.5 h-3.5" /> Add override
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
                        <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setTarget({ kind: 'user', userId: id })}>Edit</button>{' '}
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

      <SectionCard title="Effective permissions preview" subtitle="What a chosen user can actually export (user override first, otherwise their role).">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="w-full sm:w-72">
            <SelectMenu value={previewUserId} onChange={(e) => setPreviewUserId(e.target.value)} aria-label="Preview user">
              {MOCK_USERS.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </SelectMenu>
          </div>
          <span className="cc-muted text-[11px] inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Source: {hasOverride ? 'user-specific override' : `${ROLE_LABELS[previewRole]} role default`} · {effective.size} allowed, {EXPORT_FIELDS.length - effective.size} blocked
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
      </SectionCard>

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
