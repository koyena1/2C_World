import React, { useState } from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import { ProfileModal } from '../../components/common/ProfileModal';
import { cn } from '../../utils/cn';
import { SidebarTooltip } from './SidebarTooltip';
import { sidebarStyles as s } from './sidebar.styles';
import type { SidebarBranding, SidebarUser } from './sidebar.types';

interface SidebarFooterProps {
  collapsed: boolean;
  user: SidebarUser;
  branding: SidebarBranding;
  /** Called when the user saves edited name / email in the profile dialog. */
  onSaveProfile?: (values: { name: string; email: string }) => void;
}

/**
 * User card + product version. The round profile button opens the "My Profile" dialog.
 * Collapsed: the profile button only (with tooltip).
 */
export const SidebarFooter: React.FC<SidebarFooterProps> = ({ collapsed, user, branding, onSaveProfile }) => {
  const [profileOpen, setProfileOpen] = useState(false);

  const profileButton = (
    <button
      type="button"
      onClick={() => setProfileOpen(true)}
      aria-label={`Open profile: ${user.name}`}
      aria-haspopup="dialog"
      className={cn(s.avatar, 'cursor-pointer overflow-hidden hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white')}
    >
      {user.photoUrl ? (
        <img src={user.photoUrl} alt="" className="w-full h-full object-cover" draggable={false} />
      ) : (
        <UserRound className="w-5 h-5" aria-hidden />
      )}
    </button>
  );

  return (
    <>
      {collapsed ? (
        <div className={cn(s.footer, s.footerCollapsed)}>
          <SidebarTooltip label={user.name} detail={user.roleLabel} enabled>
            {profileButton}
          </SidebarTooltip>
        </div>
      ) : (
        <div className={cn(s.footer, s.footerExpanded, 'sidebar-fade-in')}>
          <div className={s.userCard}>
            {profileButton}
            <div className="min-w-0">
              <p className={s.userName}>{user.name}</p>
              {user.email && <p className={s.userEmail}>{user.email}</p>}
              <span className={s.roleChip}>
                <ShieldCheck className="w-3 h-3" />
                {user.roleLabel}
              </span>
            </div>
          </div>
          <p className={s.version}>{branding.versionLabel}</p>
        </div>
      )}

      <ProfileModal open={profileOpen} user={user} onClose={() => setProfileOpen(false)} onSave={onSaveProfile} />
    </>
  );
};
