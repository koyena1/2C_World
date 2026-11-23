import React, { useEffect, useState } from 'react';
import { FileSignature } from 'lucide-react';
import { PageHeader } from '../../components/page/PageHeader';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { useRole } from '../../context/RoleContext';
import { bestAccess, type FeatureId } from '../hr-ops/hrOps.config';
import type { Candidate } from '../../types/onboarding';
import { ContractsTab } from './ContractsTab';
import { ExitsTab } from './ExitsTab';
import { ExitDocumentsTab } from './ExitDocumentsTab';

interface Props {
  candidates: Candidate[];
  onNavigate?: (view: string) => void;
  /** Tab to open first. */
  initialTab?: string;
}

const TABS: { value: string; label: string; features: FeatureId[]; Panel: React.FC<{ candidates: Candidate[]; onNavigate?: (view: string) => void }> }[] = [
  { value: 'contracts', label: 'Contracts', features: ['contract-closure', 'auto-calls'], Panel: ContractsTab },
  { value: 'exits', label: 'Exits', features: ['exit-module', 'exit-eligibility'], Panel: ExitsTab },
  { value: 'exit-docs', label: 'Exit Documents', features: ['exit-documentation'], Panel: ExitDocumentsTab },
];

/** Contract & Exit: one tab per feature; a tab shows only when the active role has access to it. */
export const ContractExitModule: React.FC<Props> = ({ candidates, onNavigate, initialTab }) => {
  const { role } = useRole();
  const tabs = TABS.filter((t) => bestAccess(t.features, role) !== 'none');
  const [active, setActive] = useState(initialTab ?? tabs[0]?.value ?? '');
  useEffect(() => {
    if (!tabs.some((t) => t.value === active)) setActive(tabs[0]?.value ?? '');
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = tabs.find((t) => t.value === active) ?? tabs[0];

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader icon={FileSignature} title="Contract & Exit" subtitle="Contract closure, exits and exit documentation" />
      <div className="cc-container cc-stack py-5">
        <CategoryTabs tabs={tabs.map((t) => ({ value: t.value, label: t.label }))} value={current?.value ?? ''} onChange={setActive} />
        {current && <current.Panel key={current.value} candidates={candidates} onNavigate={onNavigate} />}
      </div>
    </div>
  );
};
