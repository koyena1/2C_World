import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { useRole } from '../../context/RoleContext';
import { downloadCsv } from '../../utils/download';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';
import { Dialog } from '../user-settings/SettingsParts';
import { logAudit } from './auditStore';
import { EXPORT_FIELDS, getAllowedExportFields, toCsv, useExportPolicy } from './exportPolicyStore';

interface Props {
  candidates: Candidate[];
  onDone: (message: string) => void;
}

/** Candidate Directory "Export CSV": only fields authorised for the active role end up in the file (requirement 1). */
export const ExportCsvControl: React.FC<Props> = ({ candidates, onDone }) => {
  const { role, roleLabel, actor } = useRole();
  const policy = useExportPolicy();
  const [open, setOpen] = useState(false);

  const { included, excluded } = useMemo(() => {
    const allowed = new Set(getAllowedExportFields(role));
    return {
      included: EXPORT_FIELDS.filter((f) => allowed.has(f.id)),
      excluded: EXPORT_FIELDS.filter((f) => !allowed.has(f.id)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, policy]);

  const blocked = included.length === 0;

  const handleDownload = () => {
    const rows = [included.map((f) => f.label), ...candidates.map((c) => included.map((f) => f.value(c)))];
    downloadCsv(toCsv(rows), `Candidates_Export_${DASHBOARD_REFERENCE_DATE}.csv`);
    logAudit({
      area: 'ob-export',
      action: `Exported ${candidates.length} candidate records (${included.length} fields; ${excluded.length} excluded) as ${roleLabel}`,
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
      {open && (
        <Dialog
          title="Export candidates to CSV"
          subtitle={`${candidates.length} filtered candidate(s) · exporting as ${roleLabel}`}
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
            <p className="cc-title font-bold mb-1.5">Included fields ({included.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {included.map((f) => (
                <span key={f.id} className="tone-good tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold">{f.label}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="cc-title font-bold mb-1.5">Excluded for your role ({excluded.length})</p>
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
          <p className="cc-muted text-[11px]">Export permissions are configured by an Admin under User Settings, Export Permissions. This download is logged.</p>
        </Dialog>
      )}
    </>
  );
};
