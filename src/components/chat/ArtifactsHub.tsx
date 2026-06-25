'use client';

import { useState, useCallback, useEffect } from 'react';
import { downloadBlob } from '@/lib/export';
import { formatContentForCopy } from '@/lib/format';
import { api } from '@/lib/api/client';
import { Download, Copy, Check, X, ExternalLink } from 'lucide-react';
import { renderArtifact, getArtifactLabel, getArtifactPreview } from './ArtifactRenderers';
import styles from './ArtifactsHub.module.css';
import { ARTIFACT_LABELS, EXPORT_FORMATS } from '@/constants';
import type { ArtifactType } from '@/types';

const EXPORT_LABELS: Record<string, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  markdown: 'MD',
  pptx: 'PPTX',
};

interface ArtifactHubItem {
  type: ArtifactType;
  content: Record<string, unknown>;
}

interface ArtifactsHubProps {
  projectId: string;
  artifacts: ArtifactHubItem[];
}

export function ArtifactsHub({ projectId, artifacts }: ArtifactsHubProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactHubItem | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setSelectedArtifact(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleExport = useCallback(async (format: string) => {
    setExporting(format);

    try {
      const res = await api.post(`/api/export/${format}`, { projectId });
      if (!res.ok) return;
      await downloadBlob(res, `report.${format}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ArtifactsHub] Export failed:', message);
    }
    setExporting(null);
  }, [projectId]);

  const handleCopy = useCallback(async (type: string, data: Record<string, unknown>) => {
    try {
      const label = ARTIFACT_LABELS[type] || type;
      const text = formatContentForCopy(data, label);
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // clipboard not available
    }
  }, []);

  if (artifacts.length === 0) return null;

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label={`Artifacts (${artifacts.length})`}
        title={`${artifacts.length} artifact${artifacts.length > 1 ? 's' : ''} available`}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>A</span>
        <span className={styles.fabCount}>{artifacts.length}</span>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => { setOpen(false); setSelectedArtifact(null); }}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            {selectedArtifact ? (
              <>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleRow}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>A</span>
                    <h2 className={styles.panelTitle}>
                      {ARTIFACT_LABELS[selectedArtifact.type] || selectedArtifact.type}
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className={styles.closeBtn}
                      onClick={() => setSelectedArtifact(null)}
                      aria-label="Back to artifact list"
                    >
                      <span style={{ fontSize: '13px' }}>Back</span>
                    </button>
                    <button
                      className={styles.closeBtn}
                      onClick={() => { setOpen(false); setSelectedArtifact(null); }}
                      aria-label="Close artifacts panel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className={styles.previewBody}>
                  {renderArtifact(selectedArtifact.type, selectedArtifact.content)}
                </div>
              </>
            ) : (
              <>
                <div className={styles.panelHeader}>
                  <div className={styles.panelTitleRow}>
                    <h2 className={styles.panelTitle}>Artifacts</h2>
                  </div>
                  <button
                    className={styles.closeBtn}
                    onClick={() => setOpen(false)}
                    aria-label="Close artifacts panel"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className={styles.panelBody}>
                  {artifacts.map((artifact) => {
                    const previewLines = getArtifactPreview(artifact.type, artifact.content);
                    return (
                      <div key={artifact.type} className={styles.artifactItem}>
                        <div className={styles.artifactPreview} onClick={() => setSelectedArtifact(artifact)}>
                          <div className={styles.artifactPreviewHeader}>
                            <span className={styles.artifactPreviewLabel}>
                              {ARTIFACT_LABELS[artifact.type] || artifact.type}
                            </span>
                            <ExternalLink size={12} className={styles.artifactOpenIcon} />
                          </div>
                          <div className={styles.artifactPreviewLines}>
                            {previewLines.slice(0, 2).map((line, i) => (
                              <span key={i} className={styles.artifactPreviewLine}>{line}</span>
                            ))}
                          </div>
                        </div>
                        <div className={styles.artifactActions}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => handleCopy(artifact.type, artifact.content)}
                            aria-label={copiedType === artifact.type ? 'Copied' : 'Copy content'}
                            title={copiedType === artifact.type ? 'Copied' : 'Copy content'}
                          >
                            {copiedType === artifact.type ? <Check size={15} /> : <Copy size={15} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className={styles.exportSection}>
                    <span className={styles.exportLabel}>Export all</span>
                    <div className={styles.exportActions}>
                      {EXPORT_FORMATS.map((fmt) => (
                        <button
                          key={fmt}
                          className={styles.exportBtn}
                          onClick={() => handleExport(fmt)}
                          disabled={exporting === fmt}
                          aria-label={`Export as ${EXPORT_LABELS[fmt] ?? fmt}`}
                        >
                          {exporting === fmt ? (
                            <span className={styles.exporting}>...</span>
                          ) : (
                            <>
                              <Download size={13} />
                              {EXPORT_LABELS[fmt] ?? fmt}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
