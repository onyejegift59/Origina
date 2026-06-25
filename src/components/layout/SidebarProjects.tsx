'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Check, X } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Project } from '@/types';
import styles from './SidebarProjects.module.css';

interface SidebarProjectsProps {
  collapsed: boolean;
  projects: Project[];
  activeProjectId?: string;
}

export function SidebarProjects({ collapsed, projects, activeProjectId }: SidebarProjectsProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = (project: Project) => {
    setEditingId(project.id);
    setEditValue(project.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveRename = async (projectId: string) => {
    const trimmed = editValue.trim();
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!capitalized || capitalized === projects.find((p) => p.id === projectId)?.name) {
      cancelRename();
      return;
    }

    try {
      const res = await api.patch(`/api/projects/${projectId}`, { name: capitalized });
      const result = await res.json();
      if (result.success) {
        window.dispatchEvent(new CustomEvent('projects:updated'));
      }
    } catch {
      // silently fail
    }
    cancelRename();
  };

  const handleKeyDown = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename(projectId);
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  return (
    <div className={styles.section}>
      {!collapsed && <span className={styles.sectionLabel}>Recent Projects</span>}
      <div className={styles.list} role="list" aria-label="Recent projects">
        {projects.length === 0 ? (
          <div className={styles.empty}>No projects yet</div>
        ) : (
          projects.map((project) => {
            const isActive = activeProjectId === project.id;

            if (editingId === project.id) {
              return (
                <div key={project.id} className={styles.editRow}>
                  <input
                    ref={inputRef}
                    className={styles.editInput}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, project.id)}
                    onBlur={() => saveRename(project.id)}
                    aria-label="Project name"
                  />
                  <button
                    className={styles.editAction}
                    onClick={() => saveRename(project.id)}
                    aria-label="Save"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    className={styles.editAction}
                    onClick={cancelRename}
                    aria-label="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            }

            const btn = (
              <button
                key={project.id}
                className={`${styles.projectItem} ${isActive ? styles.projectItemActive : ''}`}
                onClick={() => router.push(`/dashboard/${project.id}`)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Open ${project.name}`}
              >
                {!collapsed && (
                  <span className={styles.projectName}>{project.name}</span>
                )}
                {!collapsed && (
                  <Tooltip content="Rename">
                    <span
                      className={styles.renameIcon}
                      onClick={(e) => { e.stopPropagation(); startRename(project); }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Rename ${project.name}`}
                      onKeyDown={(e) => { if (e.key === 'Enter') startRename(project); }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                      </svg>
                    </span>
                  </Tooltip>
                )}
              </button>
            );

            return collapsed ? (
              <Tooltip key={project.id} content={project.name} side="right">
                {btn}
              </Tooltip>
            ) : (
              btn
            );
          })
        )}
      </div>
    </div>
  );
}
