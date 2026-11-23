import React, { useState, useSyncExternalStore } from 'react';
import { Link2, LogIn, Users } from 'lucide-react';
import { SectionCard } from '../../components/page/SectionCard';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { useRole, useFeatureAccess } from '../../context/RoleContext';
import { MOCK_USERS } from '../../data/mockUserSettingsData';
import { SEED_SWITCH_MAPPINGS, SWITCH_SUBJECTS, type SwitchMapping, type SwitchSubject } from '../../data/mockSwitchMappingData';
import { formatAuditTime, logAudit, useAuditLog } from '../hr-ops/auditStore';
import { Dialog, Toggle, ViewOnlyNote } from './SettingsParts';

/** Session-level store so mappings survive switching User Settings tabs. */
let mappings: SwitchMapping[] = SEED_SWITCH_MAPPINGS;
const listeners = new Set<() => void>();
const setMappings = (next: SwitchMapping[]) => {
  mappings = next;
  listeners.forEach((l) => l());
};
const useMappings = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => mappings
  );

const userById = (id?: string) => MOCK_USERS.find((u) => u.id === id);
const isDone = (m: SwitchMapping) => Boolean(m.mappedAdminId) && m.adminAppAccess;

/** Returns an error message, or null when the mapping is allowed. */
const validate = (subjectId: string, adminId: string): string | null => {
  const admin = userById(adminId);
  if (!admin) return 'Choose an HR Admin to map to.';
  if (admin.id === subjectId) return 'A user cannot be mapped to themselves.';
  if (admin.role !== 'Admin') return `${admin.name} is a ${admin.role}, not an HR Admin. Only HR Admins can be mapped.`;
  if (admin.status !== 'Active') return `${admin.name} is not active.`;
  return null;
};

export const SwitchMappingSection: React.FC<{ onShowToast: (m: string) => void }> = ({ onShowToast }) => {
  const canEdit = useFeatureAccess('user-switch') === 'manage';
  const { actor } = useRole();
  const rows = useMappings();
  const log = useAuditLog({ area: 'user-switch' });

  const [selected, setSelected] = useState<string[]>([]);
  const [mapTargets, setMapTargets] = useState<SwitchSubject[] | null>(null);
  const [adminId, setAdminId] = useState('usr-3');
  const [error, setError] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<SwitchSubject | null>(null);

  const rowOf = (id: string) => rows.find((r) => r.subjectId === id)!;
  const doneCount = rows.filter(isDone).length;

  const stamp = (m: SwitchMapping): SwitchMapping => ({ ...m, updatedBy: actor.name, updatedAt: new Date().toISOString() });
  const audit = (action: string, subjectId: string) =>
    logAudit({ area: 'user-switch', action, subjectId, actorId: actor.id, actorName: actor.name });

  const toggleAccess = (s: SwitchSubject, next: boolean) => {
    setMappings(rows.map((r) => (r.subjectId === s.id ? stamp({ ...r, adminAppAccess: next }) : r)));
    audit(`Admin App access ${next ? 'granted to' : 'removed from'} ${s.name}`, s.id);
    onShowToast(`Admin App access ${next ? 'enabled' : 'disabled'} for ${s.name}.`);
  };

  const openMap = (targets: SwitchSubject[]) => {
    setMapTargets(targets);
    setError(null);
    const first = targets.length === 1 ? rowOf(targets[0].id).mappedAdminId : undefined;
    setAdminId(first ?? 'usr-3');
  };

  const confirmMap = () => {
    if (!mapTargets) return;
    const admin = userById(adminId);
    // Single mapping: show the validation reason. Bulk: reject a bad admin, skip rows that would map to themselves.
    const msg = validate(mapTargets.length === 1 ? mapTargets[0].id : '', adminId);
    if (msg) return setError(msg);
    const ok = mapTargets.filter((t) => t.id !== adminId);
    const okIds = new Set(ok.map((t) => t.id));
    setMappings(rows.map((r) => (okIds.has(r.subjectId) ? stamp({ ...r, mappedAdminId: adminId }) : r)));
    ok.forEach((t) => audit(`${t.name} mapped to HR Admin ${admin?.name}`, t.id));
    const skipped = mapTargets.length - ok.length;
    onShowToast(
      mapTargets.length === 1
        ? `${mapTargets[0].name} mapped to ${admin?.name}.`
        : `${ok.length} user(s) mapped to ${admin?.name}${skipped ? `, ${skipped} skipped (cannot map to themselves)` : ''}.`
    );
    setMapTargets(null);
    setSelected([]);
  };

  const allSelected = selected.length === SWITCH_SUBJECTS.length;
  const toggleSel = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const previewRow = previewSubject ? rowOf(previewSubject.id) : null;
  const previewAdmin = userById(previewRow?.mappedAdminId);
  const hrAdmins = MOCK_USERS.filter((u) => u.role === 'Admin');

  return (
    <div className="cc-stack">
      {!canEdit && <ViewOnlyNote />}
      <SectionCard
        title="User switch mapping"
        subtitle={`${doneCount} Done, ${rows.length - doneCount} Pending. A candidate keeps Admin App access and the internal switch maps to an HR Admin.`}
        action={
          <button type="button" className="cc-btn cc-btn-primary" disabled={!canEdit || selected.length === 0} onClick={() => openMap(SWITCH_SUBJECTS.filter((s) => selected.includes(s.id)))}>
            <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Bulk map</span> ({selected.length})
          </button>
        }
      >
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th className="w-8">
                  <input type="checkbox" aria-label="Select all" disabled={!canEdit} checked={allSelected} onChange={() => setSelected(allSelected ? [] : SWITCH_SUBJECTS.map((s) => s.id))} className="w-4 h-4 accent-sky-600" />
                </th>
                <th>Person</th><th>Type</th><th>Admin App access</th><th>Mapped HR Admin</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {SWITCH_SUBJECTS.map((s) => {
                const r = rowOf(s.id);
                const admin = userById(r.mappedAdminId);
                return (
                  <tr key={s.id}>
                    <td>
                      <input type="checkbox" aria-label={`Select ${s.name}`} disabled={!canEdit} checked={selected.includes(s.id)} onChange={() => toggleSel(s.id)} className="w-4 h-4 accent-sky-600" />
                    </td>
                    <td className="cc-title font-semibold">{s.name}<span className="cc-muted block text-[11px] font-normal">{s.code} · {s.detail}</span></td>
                    <td>{s.kind}</td>
                    <td><Toggle checked={r.adminAppAccess} disabled={!canEdit} label={`Admin App access for ${s.name}`} onChange={(n) => toggleAccess(s, n)} /></td>
                    <td>{admin ? admin.name : <span className="cc-muted">Not mapped</span>}</td>
                    <td>
                      <span className={`${isDone(r) ? 'tone-good' : 'tone-warn'} tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold`}>
                        {isDone(r) ? 'Done' : 'Pending'}
                      </span>
                      {!isDone(r) && <span className="cc-muted block text-[10px]">{!r.mappedAdminId ? 'No HR Admin mapped' : 'Admin App access off'}</span>}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" className="cc-btn cc-btn-secondary" disabled={!canEdit} onClick={() => openMap([s])}>
                        <Link2 className="w-3.5 h-3.5" /> {admin ? 'Change' : 'Map'}
                      </button>{' '}
                      <button type="button" className="cc-btn cc-btn-secondary" disabled={!admin} onClick={() => setPreviewSubject(s)}>
                        <LogIn className="w-3.5 h-3.5" /> Switch as
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Mapping history" subtitle="Who changed a mapping or access flag, and when.">
        {log.length === 0 ? (
          <p className="cc-muted text-xs">
            Last bulk mapping: {rows.find((r) => r.updatedAt)?.updatedBy} on {formatAuditTime(rows.find((r) => r.updatedAt)!.updatedAt!)}. No changes in this session.
          </p>
        ) : (
          <ul className="cc-divide text-xs">
            {log.slice(0, 8).map((e) => (
              <li key={e.id} className="py-2 flex flex-wrap justify-between gap-x-4">
                <span className="cc-text">{e.action}</span>
                <span className="cc-muted">{e.actorName} · {formatAuditTime(e.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {mapTargets && (
        <Dialog
          title={mapTargets.length === 1 ? `Map ${mapTargets[0].name}` : `Bulk map ${mapTargets.length} users`}
          subtitle="The internal switch for the selected user(s) will open the chosen HR Admin's view."
          onClose={() => setMapTargets(null)}
          footer={
            <>
              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setMapTargets(null)}>Cancel</button>
              <button type="button" className="cc-btn cc-btn-primary" onClick={confirmMap}>Save mapping</button>
            </>
          }
        >
          <label className="cc-title font-bold block" htmlFor="switch-admin">Mapped HR Admin</label>
          <SelectMenu id="switch-admin" value={adminId} onChange={(e) => { setAdminId(e.target.value); setError(null); }}>
            {MOCK_USERS.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </SelectMenu>
          {error && <p role="alert" className="tone-bad tone-chip rounded-md px-3 py-2 text-xs font-semibold">{error}</p>}
          <p className="cc-muted text-[11px]">Only active HR Admins ({hrAdmins.map((a) => a.name).join(', ')}) are valid targets.</p>
        </Dialog>
      )}

      {previewSubject && previewRow && previewAdmin && (
        <Dialog
          title={`Switch as: ${previewAdmin.name}`}
          subtitle={`Preview of what ${previewSubject.name} sees after switching`}
          onClose={() => setPreviewSubject(null)}
          footer={<button type="button" className="cc-btn cc-btn-secondary" onClick={() => setPreviewSubject(null)}>Close preview</button>}
        >
          <p>
            <span className="cc-muted">Admin App access: </span>
            <span className={`${previewRow.adminAppAccess ? 'tone-good' : 'tone-bad'} tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold`}>
              {previewRow.adminAppAccess ? 'Retained' : 'Removed: switch is blocked'}
            </span>
          </p>
          <div>
            <p className="cc-title font-bold mb-1.5">Modules visible as {previewAdmin.role}</p>
            <div className="flex flex-wrap gap-1.5">
              {previewAdmin.allowedModules.map((m) => (
                <span key={m} className="tone-info tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold">{m}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="cc-title font-bold mb-1.5">Client scope</p>
            <ul className="space-y-1">
              {previewAdmin.mappedClients.map((c) => (
                <li key={c.clientId} className="cc-text">{c.clientName} <span className="cc-muted">· {c.candidateAccessScope}</span></li>
              ))}
            </ul>
          </div>
        </Dialog>
      )}
    </div>
  );
};
