import React from 'react';
import { PenLine } from 'lucide-react';
import { SectionCard } from '../../components/page/SectionCard';
import { useRole, useFeatureAccess } from '../../context/RoleContext';
import { CLIENT_NAMES, setSignatureEnabled, useSignatureEnabledMap } from '../hr-ops/clientFeatureStore';
import { formatAuditTime, logAudit, useAuditLog } from '../hr-ops/auditStore';
import { Toggle, ViewOnlyNote } from './SettingsParts';

const SEED_LOG = [
  { id: 'seed-1', action: 'Physical signature enabled for Tata Consultancy Services', actorName: 'Ananya Mukherjee', at: '2026-09-02T11:20:00+05:30' },
  { id: 'seed-2', action: 'Physical signature enabled for Infosys Technologies', actorName: 'Ananya Mukherjee', at: '2026-09-09T15:05:00+05:30' },
  { id: 'seed-3', action: 'Physical signature enabled for Flipkart Internet Pvt Ltd', actorName: 'Rajesh Sen', at: '2026-09-21T10:45:00+05:30' },
];

export const ClientFeaturesSection: React.FC<{ onShowToast: (m: string) => void }> = ({ onShowToast }) => {
  const canEdit = useFeatureAccess('signature-upload') === 'manage';
  const { actor } = useRole();
  const map = useSignatureEnabledMap();
  const live = useAuditLog({ area: 'signature-upload' });
  const log = [...live.map((e) => ({ id: e.id, action: e.action, actorName: e.actorName, at: e.at })), ...SEED_LOG];
  const enabledCount = CLIENT_NAMES.filter((c) => map[c]).length;

  const change = (client: string, next: boolean) => {
    setSignatureEnabled(client, next);
    logAudit({
      area: 'signature-upload',
      action: `Physical signature ${next ? 'enabled' : 'disabled'} for ${client}`,
      subjectId: client,
      actorId: actor.id,
      actorName: actor.name,
    });
    onShowToast(`Physical signature ${next ? 'enabled' : 'disabled'} for ${client}.`);
  };

  return (
    <div className="cc-stack">
      {!canEdit && <ViewOnlyNote />}
      <SectionCard
        title="Physical signature (per client)"
        subtitle={`${enabledCount} of ${CLIENT_NAMES.length} clients have the feature switched on`}
      >
        <div className="cc-callout tone-info mb-3">
          <PenLine className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs">
            When ON for a client: its employees see the signature upload section in their profile, with a consent checkbox, and HR can approve letters that carry the uploaded signature. When OFF the section is hidden and letters are approved without it.
          </p>
        </div>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr><th>Client</th><th>Status</th><th>Physical signature</th></tr>
            </thead>
            <tbody>
              {CLIENT_NAMES.map((c) => (
                <tr key={c}>
                  <td className="cc-title font-semibold">{c}</td>
                  <td>
                    <span className={`${map[c] ? 'tone-good' : 'tone-muted'} tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold`}>
                      {map[c] ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td><Toggle checked={Boolean(map[c])} disabled={!canEdit} label={`Physical signature for ${c}`} onChange={(n) => change(c, n)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Change log" subtitle="Who switched the feature, and when.">
        <ul className="cc-divide text-xs">
          {log.map((e) => (
            <li key={e.id} className="py-2 flex flex-wrap justify-between gap-x-4">
              <span className="cc-text">{e.action}</span>
              <span className="cc-muted">{e.actorName} · {formatAuditTime(e.at)}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
};
