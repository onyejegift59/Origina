'use client';

import { Plus, PanelLeft } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './SidebarHeader.module.css';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  onNewProject: () => void;
}

export function SidebarHeader({ collapsed, onToggle, onNewProject }: SidebarHeaderProps) {
  return (
    <div className={`${styles.header} ${collapsed ? styles.headerCollapsed : ''}`}>
      <div className={styles.topRow}>
        {collapsed ? (
          <Tooltip content="Expand sidebar" side="right">
            <button
              className={styles.toggleBtn}
              onClick={onToggle}
              aria-label="Expand sidebar"
            >
              <PanelLeft size={16} aria-hidden="true" />
            </button>
          </Tooltip>
        ) : (
          <>
            <span className={styles.logo}>Origina</span>
            <Tooltip content="Collapse sidebar" side="right">
              <button
                className={styles.toggleBtn}
                onClick={onToggle}
                aria-label="Collapse sidebar"
              >
                <PanelLeft size={16} aria-hidden="true" />
              </button>
            </Tooltip>
          </>
        )}
      </div>

      {collapsed ? (
        <Tooltip content="New Project" side="right">
          <button className={styles.newProjectCompact} onClick={onNewProject} aria-label="New Project">
            <Plus size={18} aria-hidden="true" />
          </button>
        </Tooltip>
      ) : (
        <button className={styles.newProject} onClick={onNewProject} aria-label="New Project">
          <Plus size={18} aria-hidden="true" />
          <span>New Project</span>
        </button>
      )}
    </div>
  );
}
