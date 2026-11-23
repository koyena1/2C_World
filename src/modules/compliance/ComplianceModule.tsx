import React, { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { PageHeader } from '../../components/page/PageHeader';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { useRole } from '../../context/RoleContext';
import { bestAccess, type FeatureId } from '../hr-ops/hrOps.config';
import type { Candidate } from '../../types/onboarding';
import { UanEsicLogTab } from './UanEsicLogTab';
import { EsicValidationTab } from './EsicValidationTab';
import { PfConfigTab } from './PfConfigTab';
import { ComplianceFormsTab } from './ComplianceFormsTab';
import { InsuranceTab } from './InsuranceTab';

interface Props {
  candidates: Candidate[];
  /** Tab to open first. */
  initialTab?: string;
}

const TABS: { value: string; label: string; features: FeatureId[]; Panel: React.FC<{ candidates: Candidate[] }> }[] = [
  { value: 'uan', label: 'UAN & ESIC Log', features: ['uan-esic-log'], Panel: UanEsicLogTab },
  { value: 'esic', label: 'ESIC Validation', features: ['esic-validation'], Panel: EsicValidationTab },
  { value: 'pf', label: 'PF Configuration', features: ['pf-config'], Panel: PfConfigTab },
  { value: 'forms', label: 'Forms', features: ['compliance-forms'], Panel: ComplianceFormsTab },
  { value: 'insurance', label: 'Insurance', features: ['insurance'], Panel: InsuranceTab },
];

/** Compliance: one tab per feature; a tab shows only when the active role has access to it. */
export const ComplianceModule: React.FC<Props> = ({ candidates, initialTab }) => {
  const { role } = useRole();
  const tabs = TABS.filter((t) => bestAccess(t.features, role) !== 'none');
  const [active, setActive] = useState(initialTab ?? tabs[0]?.value ?? '');
  useEffect(() => {
    if (!tabs.some((t) => t.value === active)) setActive(tabs[0]?.value ?? '');
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = tabs.find((t) => t.value === active) ?? tabs[0];

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader icon={Scale} title="Compliance" subtitle="UAN & ESIC tracking, ESIC validation, PF configuration, statutory forms and insurance" />
      <div className="cc-container cc-stack py-5">
        <CategoryTabs tabs={tabs.map((t) => ({ value: t.value, label: t.label }))} value={current?.value ?? ''} onChange={setActive} />
        {current && <current.Panel key={current.value} candidates={candidates} />}
      </div>
    </div>
  );
};
