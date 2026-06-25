'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api/client';
import type { Project, ProjectOutput } from '@/types';

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<ProjectOutput[]>([]);
  const [loading, setLoading] = useState(true);

  const stableIdRef = useRef(projectId);
  if (projectId) stableIdRef.current = projectId;
  const stableId = projectId || stableIdRef.current;

  const fetchSilently = useCallback(async () => {
    const id = stableIdRef.current;
    if (!id) return;
    try {
      const response = await api.get(`/api/projects/${id}`);
      const result = await response.json();
      if (result.success) {
        setProject(result.data);
        setArtifacts(result.data.artifacts || []);
      }
    } catch {
      // silent — stale data is acceptable
    }
  }, []);

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

    setLoading(true);
    load().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [stableId]);

  return { project, artifacts, loading, refetch: fetchSilently };
}
