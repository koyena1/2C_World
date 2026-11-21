import React from 'react';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
} as const;

interface AvatarProps {
  initials: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Round initials avatar. */
export const Avatar: React.FC<AvatarProps> = ({ initials, size = 'md', className }) => (
  <div
    aria-hidden
    className={cn(
      'shrink-0 rounded-full flex items-center justify-center font-bold text-white select-none',
      'bg-slate-800 dark:bg-sky-700',
      SIZES[size],
      className
    )}
  >
    {initials}
  </div>
);
