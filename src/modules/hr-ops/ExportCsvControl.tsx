import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { useRole } from '../../context/RoleContext';
import { downloadCsv } from '../../utils/download';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';
import { Dialog } from '../user-settings/SettingsParts';
import { logAudit } from './auditStore';
import { EXPORT_FIELDS, getAllowedExportFields, roleOfSystemRole, toCsv, useExportPolicy } from './exportPolicyStore';
import { MOCK_USERS } from '../../data/mockUserSettingsData';
import { SelectMenu } from '../../components/ui/SelectMenu';

interface Props {
  candidates: Candidate[];
  onDone: (message: string) => void;
}

/** Candidate Directory "Export CSV": only fields authorised for the active role end up in the file (requirement 1). */
export const ExportCsvControl: React.FC<Props> = ({ candidates, onDone }) => {
  const { role, roleLabel, actor } = useRole();
  const policy = useExportPolicy();
  const [open, setOpen] = useState(false);
  // There is no real sign-in in this frontend demo, so the person exporting can be chosen to show how a
  // user-specific override (by User ID) changes the file. Empty = the signed-in role.
  const [asUserId, setAsUserId] = useState('');
  const asUser = MOCK_USERS.find((u) => u.id === asUserId);
  const exportRole = asUser ? roleOfSystemRole(asUser.role) : role;

  const { included, excluded } = useMemo(() => {
    const allowed = new Set(getAllowedExportFields(exportRole, asUser?.id));
    return {
      included: EXPORT_FIELDS.filter((f) => allowed.has(f.id)),
      excluded: EXPORT_FIELDS.filter((f) => !allowed.has(f.id)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportRole, asUserId, policy]);

  const blocked = included.length === 0;

  const handleDownload = () => {
    const rows = [included.map((f) => f.label), ...candidates.map((c) => included.map((f) => f.value(c)))];
    downloadCsv(toCsv(rows), `Candidates_Export_${DASHBOARD_REFERENCE_DATE}.csv`);
    logAudit({
      area: 'ob-export',
      action: `Exported ${candidates.length} candidate records (${included.length} fields; ${excluded.length} excluded) as ${asUser ? `${asUser.name} (${asUser.id})` : roleLabel}`,
      subjectId: 'candidate-directory',
      actorId: actor.id,
      actorName: actor.name,
    });
    setOpen(false);
    onDone(`Exported ${candidates.length} candidate records with ${included.length} authorised fields to CSV.`);
  };

  return (
    <>
      <button
        type="button"
        disabled={blocked}
        title={blocked ? `Export is not permitted for the ${roleLabel} role. Ask an Admin to grant export fields in User Settings.` : 'Export filtered candidates to CSV'}
        onClick={() => setOpen(true)}
        className="px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">Export CSV</span>
      </button>
      {open &&
        // Portal to <body>: inside the page container the fixed overlay was sized to the whole page and the dialog landed off-screen.
        createPortal(
        <Dialog
          title="Export candidates to CSV"
          subtitle={`${candidates.length} filtered candidate(s) · exporting as ${asUser ? asUser.name : roleLabel}`}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="cc-btn cc-btn-primary" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </>
          }
        >
          <div>
            <label htmlFor="export-as" className="cc-title font-bold block mb-1.5">Export as</label>
            <SelectMenu id="export-as" value={asUserId} onChange={(e) => setAsUserId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
              <option value="">Me ({roleLabel})</option>
              {MOCK_USERS.map((u) => (
                <option key={u.id} value={u.id}>{u.name} · {u.id} · {u.role}{getAllowedExportFields(roleOfSystemRole(u.role), u.id) !== getAllowedExportFields(roleOfSystemRole(u.role)) ? ' (user override)' : ''}</option>
              ))}
            </SelectMenu>
            <p className="cc-muted text-[11px] mt-1">Pick a user to see exactly what that user's file would contain (a user-specific permission beats the role).</p>
          </div>
          <div>
            <p className="cc-title font-bold mb-1.5">Included fields ({included.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {included.map((f) => (
                <span key={f.id} className="tone-good tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold">{f.label}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="cc-title font-bold mb-1.5">Excluded from the file ({excluded.length})</p>
            {excluded.length === 0 ? (
              <p className="cc-muted">Nothing is excluded.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {excluded.map((f) => (
                  <span key={f.id} className="tone-bad tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold line-through">{f.label}</span>
                ))}
              </div>
            )}
          </div>
          <p className="cc-muted text-[11px]">Export permissions are set by an Admin under User Settings → OB Data Export. This download is logged.</p>
        </Dialog>,
        document.body
        )}
    </>
  );
};
