'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProject } from '@/hooks/useProject';
import { ChatWorkspace } from '@/components/chat/ChatWorkspace';
import type { ArtifactType } from '@/types';
import styles from '../dashboard.module.css';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, artifacts, loading, refetch } = useProject(projectId);

  if (!loading && !project) {
    return (
      <div className={styles.notFound}>
        <p style={{ color: 'var(--on-surface-variant)' }}>Project not found</p>
      </div>
    );
  }

  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/projects" className={styles.breadcrumbLink}>Projects</Link>
        <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
        <span className={styles.breadcrumbCurrent}>{project?.name ?? '...'}</span>
      </nav>
      <ChatWorkspace
        projectId={projectId}
        projectName={project?.name ?? ''}
        projectIdea={project?.idea ?? ''}
        artifacts={artifacts.map((a) => ({
          type: a.type as ArtifactType,
          content: a.content as Record<string, unknown>,
        }))}
        onArtifactsChange={refetch}
      />
    </>
  );
}
