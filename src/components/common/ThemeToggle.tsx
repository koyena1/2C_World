import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { IconButton } from '../ui/IconButton';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Icon-only theme switch: shows a Moon in Light mode (click for dark)
 * and a Sun in Dark mode (click for light).
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const Icon = isDark ? Sun : Moon;

  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn('text-slate-700 dark:text-amber-300', className)}
    >
      <Icon className="w-4 h-4" />
    </IconButton>
  );
};
