'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import type { Project, ProjectOutput } from '@/types';

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<ProjectOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [stableId, setStableId] = useState(projectId);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (projectId) setStableId(projectId);
  }, [projectId]);

  const fetchSilently = useCallback(async () => {
    if (!stableId) return;
    try {
      const response = await api.get(`/api/projects/${stableId}`);
      const result = await response.json();
      if (result.success) {
        setProject(result.data);
        setArtifacts(result.data.artifacts || []);
      }
    } catch {
    }
  }, [stableId]);

  useEffect(() => {
    if (!stableId) return;
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;

      const response = await api.get(`/api/projects/${stableId}`);
      const result = await response.json();
      if (cancelled) return;

      if (result.success) {
        setProject(result.data);
        setArtifacts(result.data.artifacts || []);
      }
      setLoading(false);
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    load().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [stableId]);

  return { project, artifacts, loading, refetch: fetchSilently };
}
