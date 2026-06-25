'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  FolderKanban,
  FileText,
  Cog,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './SidebarNavigation.module.css';

const NAV_ITEMS = [
  { id: 'projects', label: 'Projects', icon: FolderKanban, href: '/projects' },
  { id: 'artifacts', label: 'Artifacts', icon: FileText, href: '/artifacts' },
  { id: 'settings', label: 'Settings', icon: Cog, href: '/settings' },
] as const;

interface SidebarNavigationProps {
  collapsed: boolean;
}

export function SidebarNavigation({ collapsed }: SidebarNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        const btn = (
          <button
            key={item.id}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${collapsed ? styles.navItemCollapsed : ''}`}
            onClick={() => router.push(item.href)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <Icon size={18} className={styles.navIcon} aria-hidden="true" />
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </button>
        );

        return collapsed ? (
          <Tooltip key={item.id} content={item.label} side="right">
            {btn}
          </Tooltip>
        ) : (
          btn
        );
      })}
    </nav>
  );
}
