import React from 'react';
import { useDocumentRules } from '../../modules/hr-ops/documentRulesStore';

interface Props {
  /** Rule id from mockDocumentRulesData (aadhaar, pan, bank, education, experience, photo, signature, bulk). */
  rule: string;
  className?: string;
}

/** Small "PDF, JPG, PNG · max 2 MB" line shown under an upload control (requirement 12). */
export const AllowedFileSizeHint: React.FC<Props> = ({ rule, className }) => {
  const r = useDocumentRules().find((x) => x.id === rule);
  if (!r) return null;
  return (
    <p className={`cc-muted text-[11px] ${className ?? ''}`}>
      Allowed: {r.formats.join(', ')} · max {r.maxMb} MB
    </p>
  );
};
