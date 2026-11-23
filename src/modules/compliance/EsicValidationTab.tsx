import React from 'react';
import type { Candidate } from '../../types/onboarding';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess } from '../../context/RoleContext';
import { UploadValidator } from './esic/UploadValidator';
import { ApplicabilityPanel } from './esic/ApplicabilityPanel';

/** Compliance -> ESIC Validation: upload check with plain-language errors, and client-wise applicability rules. */
export const EsicValidationTab: React.FC<{ candidates: Candidate[] }> = () => {
  const access = useFeatureAccess('esic-validation');
  const { message, showToast, hideToast } = useToast();
  if (access === 'none') return null;
  return (
    <div className="cc-stack">
      <UploadValidator notify={showToast} />
      <ApplicabilityPanel notify={showToast} />
      <Toast message={message} onClose={hideToast} />
    </div>
  );
};
