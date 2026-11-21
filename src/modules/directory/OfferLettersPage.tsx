import React from 'react';
import type { Candidate } from '../../types/onboarding';
import { OfferLetterOperations } from './OfferLetterOperations';

interface OfferLettersPageProps {
  candidates: Candidate[];
  onOpenCandidateProfile: (candidate: Candidate) => void;
}

/** Stand-alone "Offer Letters" page (opened from the sidebar menu). Header and content live in OfferLetterOperations. */
export const OfferLettersPage: React.FC<OfferLettersPageProps> = ({ candidates, onOpenCandidateProfile }) => (
  <OfferLetterOperations
    fullCandidateList={candidates}
    onOpenCandidate360={(candOrCode) => {
      if (typeof candOrCode === 'string') {
        const found = candidates.find((c) => c.userId === candOrCode || c.id === candOrCode);
        if (found) onOpenCandidateProfile(found);
      } else {
        onOpenCandidateProfile(candOrCode);
      }
    }}
  />
);
