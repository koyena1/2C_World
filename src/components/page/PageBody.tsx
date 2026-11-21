import React from 'react';
import { cn } from '../../utils/cn';

/** Content area under a PageHeader: shared gutters, max width and vertical rhythm. */
export const PageBody: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('cc-container cc-stack py-5', className)}>{children}</div>
);
