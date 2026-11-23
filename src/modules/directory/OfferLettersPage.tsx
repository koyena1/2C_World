import React, { useState } from 'react';
import type { Candidate } from '../../types/onboarding';
import { OfferLetterOperations } from './OfferLetterOperations';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { FileText } from 'lucide-react';
import { LetterBuilderPanel } from './LetterBuilderPanel';
import { LetterApprovalsPanel } from './LetterApprovalsPanel';

interface OfferLettersPageProps {
  candidates: Candidate[];
  onOpenCandidateProfile: (candidate: Candidate) => void;
}

const TABS = [
  { value: 'letters', label: 'Letters' },
  { value: 'templates', label: 'Templates & Variables' },
  { value: 'approvals', label: 'Letter Approvals' },
];

/** Stand-alone "Offer Letters" page (opened from the sidebar menu). The Letters tab is the original screen. */
export const OfferLettersPage: React.FC<OfferLettersPageProps> = ({ candidates, onOpenCandidateProfile }) => {
  const [tab, setTab] = useState('letters');
  return (
    <div className="flex-1 flex flex-col">
      <div className="cc-container pt-3">
        <CategoryTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>
      {tab === 'letters' && (
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
      )}
      {tab === 'templates' && (
        <>
          <PageHeader icon={FileText} title="Letter Templates & Variables" subtitle="Edit letter templates and the merge fields they can use" />
          <PageBody><LetterBuilderPanel /></PageBody>
        </>
      )}
      {tab === 'approvals' && (
        <>
          <PageHeader icon={FileText} title="Letter Approvals" subtitle="Employee acceptance of Offer, Extension and Hike letters" />
          <PageBody><LetterApprovalsPanel /></PageBody>
        </>
      )}
    </div>
  );
};
