import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Chip } from '../dashboard/command-center/shared';
import type { ExtendedImportLog } from '../../data/mockBulkImportData';

/** Status pill for an import batch (shared by the Hub activity table and every workflow's history table). */
export const ImportStatusChip: React.FC<{ status: ExtendedImportLog['status'] }> = ({ status }) => {
  switch (status) {
    case 'Completed':
      return <Chip tone="good" className="gap-1 rounded-full"><CheckCircle2 className="w-3 h-3" />Completed</Chip>;
    case 'Partially Completed':
      return <Chip tone="warn" className="gap-1 rounded-full"><AlertTriangle className="w-3 h-3" />Partially Done</Chip>;
    case 'Failed':
      return <Chip tone="bad" className="rounded-full">Failed</Chip>;
    default:
      return <Chip tone="info" className="rounded-full">Processing</Chip>;
  }
};
