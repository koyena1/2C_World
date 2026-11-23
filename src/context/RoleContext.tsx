import React, { createContext, useContext, useMemo } from 'react';
import {
  accessFor,
  ROLE_LABELS,
  type AccessLevel,
  type AppRole,
  type FeatureId,
} from '../modules/hr-ops/hrOps.config';

/** Who the signed-in (simulated) user is, per role. Used for "updated by" columns and audit entries. */
export const ACTORS: Record<AppRole, { id: string; name: string }> = {
  admin: { id: 'USR-001', name: 'Ananya (Ops Lead)' },
  hr: { id: 'USR-014', name: 'Vikram (Client HR)' },
  hrbp: { id: 'USR-027', name: 'HR Business Partner' },
};

interface RoleContextValue {
  role: AppRole;
  roleLabel: string;
  actor: { id: string; name: string };
}

const RoleContext = createContext<RoleContextValue>({
  role: 'admin',
  roleLabel: ROLE_LABELS.admin,
  actor: ACTORS.admin,
});

/** Frontend simulation of the active role; provided once in App.tsx. */
export const RoleProvider: React.FC<{ role: AppRole; children: React.ReactNode }> = ({ role, children }) => {
  const value = useMemo(() => ({ role, roleLabel: ROLE_LABELS[role], actor: ACTORS[role] }), [role]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => useContext(RoleContext);

/** Access of the active role to one feature: 'manage' | 'view' | 'none'. Disable edit controls unless 'manage'. */
export const useFeatureAccess = (feature: FeatureId): AccessLevel => accessFor(feature, useRole().role);
