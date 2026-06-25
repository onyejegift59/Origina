'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { FolderKanban, Menu, Plus, Check, X } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Project } from '@/types';
import styles from './projects.module.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const result = await res.json();
        if (result.success) {
          setProjects(result.data || []);
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    };

    fetchProjects();
  }, [router]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleMobileToggle = () => {
    window.dispatchEvent(new CustomEvent('sidebar:toggle'));
  };

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
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, name: capitalized } : p))
        );
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
    <div className={styles.page}>
      <div className={styles.mobileHeader}>
        <button
          className={styles.menuBtn}
          onClick={handleMobileToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Projects</h1>
          <button
            className={styles.newBtn}
            onClick={() => router.push('/dashboard')}
            aria-label="New project"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        </div>

        {loading ? (
          <div className={styles.grid} aria-label="Loading projects" role="status" aria-live="polite">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.state}>
            <FolderKanban size={40} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No projects yet</p>
            <p className={styles.emptyDesc}>Create your first project to get started.</p>
          </div>
        ) : (
          <>
            <div className={styles.searchRow}>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search projects"
              />
            </div>
            <div className={styles.grid}>
            {projects
              .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((project) => (
              <div key={project.id} className={styles.card}>
                {editingId === project.id ? (
                  <div className={styles.editRow}>
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
                      <Check size={14} />
                    </button>
                    <button
                      className={styles.editAction}
                      onClick={cancelRename}
                      aria-label="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className={styles.cardMain}
                      onClick={() => router.push(`/dashboard/${project.id}`)}
                    >
                      <span className={styles.cardName}>{project.name.charAt(0).toUpperCase() + project.name.slice(1)}</span>
                      <span className={styles.cardDate}>
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </button>
                    <Tooltip content="Rename" side="top">
                      <button
                        className={styles.renameBtn}
                        onClick={() => startRename(project)}
                        aria-label={`Rename ${project.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          <path d="m15 5 4 4"/>
                        </svg>
                      </button>
                    </Tooltip>
                  </>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}





