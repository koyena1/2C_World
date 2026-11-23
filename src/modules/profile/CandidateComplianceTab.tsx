import React, { useMemo } from 'react';
import { LifeBuoy } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { SectionCard } from '../../components/page/SectionCard';
import { formatAuditTime, useAuditLog } from '../hr-ops/auditStore';
import { useFeatureAccess } from '../../context/RoleContext';
import { getUanEsicHistory, MOCK_UAN_ESIC_RECORDS } from '../../data/mockUanData';
import { SignatureUploadPanel } from '../directory/SignatureUploadPanel';

/**
 * Candidate 360 -> "Compliance & Signature": the candidate's UAN / ESIC status with its full
 * update history (who and when), the physical signature with consent, and a shortcut to raise a ticket.
 */
export const CandidateComplianceTab: React.FC<{ candidate: Candidate; onRaiseTicket?: (candidate: Candidate) => void }> = ({ candidate, onRaiseTicket }) => {
  const record = MOCK_UAN_ESIC_RECORDS.find((r) => r.candidateId === candidate.id);
  const live = useAuditLog({ area: 'uan-esic-log', subjectId: candidate.id });
  const ticketAccess = useFeatureAccess('tickets');
  const logAccess = useFeatureAccess('uan-esic-log');

  const history = useMemo(
    () => [
      ...live.map((e) => ({ id: e.id, text: e.action, actorName: e.actorName, at: e.at })),
      ...getUanEsicHistory(candidate.id).map((h) => ({
        id: h.id,
        text: `${h.field} changed${h.oldValue ? ` from ${h.oldValue}` : ''} to ${h.newValue}`,
        actorName: h.actorName,
        at: h.at,
      })),
    ],
    [live, candidate.id]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {ticketAccess !== 'none' && (
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            disabled={ticketAccess !== 'manage' || !onRaiseTicket}
            onClick={() => onRaiseTicket?.(candidate)}
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Raise ticket for this candidate
          </button>
        )}
      </div>

      {logAccess !== 'none' && (
        <SectionCard title="UAN & ESIC" subtitle="Current status and every update with who made it and when">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            {[
              ['UAN', record?.uan || '—'],
              ['UAN status', record?.uanStatus ?? 'Not tracked'],
              ['ESIC', record?.esic || '—'],
              ['ESIC status', record?.esicStatus ?? 'Not tracked'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="cc-muted">{k}</dt>
                <dd className="cc-title font-semibold tabular-nums break-all">{v}</dd>
              </div>
            ))}
          </dl>
          {history.length === 0 ? (
            <p className="cc-muted text-xs">No UAN or ESIC updates recorded for this candidate yet.</p>
          ) : (
            <ul className="cc-divide text-xs">
              {history.map((h) => (
                <li key={h.id} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="cc-title">{h.text}</span>
                  <span className="cc-muted">
                    {h.actorName} · {formatAuditTime(h.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      <SectionCard title="Signature" subtitle="Physical signature used on this employee's documents">
        <SignatureUploadPanel candidate={candidate} />
      </SectionCard>
    </div>
  );
};
