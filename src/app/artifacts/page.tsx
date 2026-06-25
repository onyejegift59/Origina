'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Menu } from 'lucide-react';
import { ArtifactCard } from '@/components/chat/ArtifactCard';
import { SkeletonListItem } from '@/components/ui/Skeleton';
import type { ProjectOutput, ArtifactType } from '@/types';
import styles from './artifacts.module.css';
import cardStyles from '@/components/chat/ArtifactCard.module.css';

interface ArtifactWithProject extends ProjectOutput {
  project_name: string;
}

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<ArtifactWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const res = await api.get('/api/artifacts');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const result = await res.json();
        if (result.success) {
          setArtifacts(result.data || []);
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    };

    fetchArtifacts();
  }, [router]);

  const handleMobileToggle = () => {
    window.dispatchEvent(new CustomEvent('sidebar:toggle'));
  };

  const grouped = artifacts.reduce<Record<string, ArtifactWithProject[]>>((acc, a) => {
    if (!acc[a.project_name]) acc[a.project_name] = [];
    acc[a.project_name].push(a);
    return acc;
  }, {});

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
        <h1 className={styles.title}>Artifacts</h1>

        {loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cardStyles.documentCard} style={{ aspectRatio: '4 / 3' }}>
                <SkeletonListItem />
              </div>
            ))}
          </div>
        ) : artifacts.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No artifacts yet</p>
            <p className={styles.emptyDesc}>Artifacts are generated when you analyze a project.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([projectName, items]) => (
            <div key={projectName} className={styles.group}>
              <div className={styles.groupHeader}>
                <h2 className={styles.groupTitle}>{projectName}</h2>
                <button
                  className={styles.projectLink}
                  onClick={() => router.push(`/dashboard/${items[0].project_id}`)}
                >
                  View project
                </button>
              </div>
              <div className={styles.artifactGrid}>
                {items.map((artifact) => (
                  <ArtifactCard
                    key={artifact.id}
                    type={artifact.type as ArtifactType}
                    content={artifact.content}
                    onCardClick={() => router.push(`/dashboard/${artifact.project_id}`)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
