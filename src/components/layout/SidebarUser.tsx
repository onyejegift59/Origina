'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './SidebarUser.module.css';

interface SidebarUserProps {
  collapsed: boolean;
  onLogout: () => void;
}

export function SidebarUser({ collapsed, onLogout }: SidebarUserProps) {
  const { user } = useAuth();

  const userName = useMemo(() => {
    const meta = user?.user_metadata;
    if (meta?.full_name) return meta.full_name;
    if (meta?.name) return meta.name;
    if (user?.email) return user.email.split('@')[0];
    return '';
  }, [user]);

  const avatarUrl = useMemo(() => {
    return user?.user_metadata?.avatar_url || '';
  }, [user]);

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className={styles.userSection}>
      {collapsed ? (
        <div className={styles.collapsedRow}>
          <Tooltip content={userName || 'User'} side="right">
            <button className={styles.avatarCompact} aria-label="User menu">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarText}>{initials}</span>
              )}
            </button>
          </Tooltip>
          <Tooltip content="Sign out" side="right">
            <button className={styles.iconBtn} onClick={onLogout} aria-label="Sign out">
              <LogOut size={18} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      ) : (
        <>
          <div className={styles.userRow}>
            <div className={styles.avatar}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarText}>{initials}</span>
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userName || 'User'}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={onLogout} aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </>
      )}
    </div>
  );
}
