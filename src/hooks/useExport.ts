'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { downloadBlob } from '@/lib/export';

export function useExport(projectId: string): {
  exporting: string | null;
  handleExport: (format: string) => Promise<void>;
} {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = useCallback(async (format: string) => {
    setExporting(format);
    try {
      const res = await api.post(`/api/export/${format}`, { projectId });
      if (!res.ok) return;
      await downloadBlob(res, `report.${format}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[useExport] Export failed:`, message);
    }
    setExporting(null);
  }, [projectId]);

  return { exporting, handleExport };
}
