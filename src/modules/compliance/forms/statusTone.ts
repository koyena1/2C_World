import type { FormStatus } from '../../../data/mockComplianceFormsData';

export const STATUS_TONE: Record<FormStatus, 'muted' | 'info' | 'violet' | 'good' | 'bad'> = {
  'Not started': 'muted',
  Draft: 'info',
  Submitted: 'violet',
  Verified: 'good',
  Returned: 'bad',
};
