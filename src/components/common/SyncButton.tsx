import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { cn } from '../../utils/cn';

interface SyncButtonProps {
  className?: string;
}

const SYNC_DURATION_MS = 700;
const LABEL = 'Sync Data';
const TOOLTIP = 'Synchronize live operational data from ERP and ATS';

/** Icon-only header button (same look as the theme toggle): the icon spins while syncing. */
export const SyncButton: React.FC<SyncButtonProps> = ({ className }) => {
  const [syncing, setSyncing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = () => {
    setSyncing(true);
    timer.current = window.setTimeout(() => {
      setSyncing(false);
    }, SYNC_DURATION_MS);
  };

  return (
    <IconButton
      onClick={handleClick}
      disabled={syncing}
      aria-label={syncing ? 'Syncing data' : LABEL}
      aria-busy={syncing}
      title={TOOLTIP}
      className={cn('text-slate-700 dark:text-slate-300 disabled:cursor-default', className)}
    >
      <RefreshCw className={cn('w-4 h-4 text-sky-500', syncing && 'animate-spin')} />
    </IconButton>
  );
};
