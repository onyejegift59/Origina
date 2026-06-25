'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './SidebarUser.module.css';

interface SidebarUserProps {
  collapsed: boolean;
  onLogout: () => void;
}

export function SidebarUser({ collapsed, onLogout }: SidebarUserProps) {
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const meta = user?.user_metadata;
    if (meta?.full_name) {
      setUserName(meta.full_name);
    } else if (meta?.name) {
      setUserName(meta.name);
    } else if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }
    if (meta?.avatar_url) {
      setAvatarUrl(meta.avatar_url);
    }
  }, [user]);

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className={styles.userSection}>
      {collapsed ? (
        <div className={styles.collapsedRow}>
          <Tooltip content={userName || 'User'} side="right">
            <button className={styles.avatarCompact} aria-label="User menu">
              {avatarUrl ? (
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
