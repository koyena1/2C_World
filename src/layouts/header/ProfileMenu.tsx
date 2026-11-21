import React from 'react';
import { UserRound } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Dropdown } from '../../components/ui/Dropdown';
import { IconButton } from '../../components/ui/IconButton';
import { useProfileOverrides } from '../../hooks/useProfileOverrides';
import { DEFAULT_HEADER_USER_KEY, HEADER_USERS } from './header.config';

const initialsOf = (name: string) =>
  name.replace(/(.*?)/g, '').trim().split(/s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

interface ProfileMenuProps {
  /** Active role (admin / hr / candidate …) – selects which user is shown. */
  role: string;
}

/** Profile icon button; opens a small card with the user's avatar, name and role. */
export const ProfileMenu: React.FC<ProfileMenuProps> = ({ role }) => {
  const key = HEADER_USERS[role] ? role : DEFAULT_HEADER_USER_KEY;
  const { edits } = useProfileOverrides(key);
  const base = HEADER_USERS[key];
  const user = edits ? { ...base, name: edits.name, initials: initialsOf(edits.name) || base.initials } : base;

  return (
    <Dropdown
      label="Account"
      align="right"
      trigger={({ ref, ...triggerProps }, { open }) => (
        <IconButton
          ref={ref}
          aria-label="Open profile menu"
          title="Profile"
          className={
            open
              ? 'text-sky-600 dark:text-sky-300 border-sky-500/60 dark:border-sky-500/60'
              : 'text-slate-700 dark:text-slate-200'
          }
          {...triggerProps}
        >
          <UserRound className="w-4 h-4" />
        </IconButton>
      )}
    >
      <div className="flex items-center gap-3 px-2 py-1.5 pr-4">
        <Avatar initials={user.initials} size="md" />
        <div className="min-w-0 text-left">
          <p className="text-sm font-semibold leading-tight truncate">{user.name}</p>
          <p className="text-[11px] leading-tight mt-0.5 text-[color:var(--popover-muted)]">{user.roleLabel}</p>
        </div>
      </div>
    </Dropdown>
  );
};
