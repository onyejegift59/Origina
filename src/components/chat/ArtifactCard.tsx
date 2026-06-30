'use client';

import { useState, useEffect, memo } from 'react';
import {
  RefreshCw, ChevronDown, ChevronUp,
  ExternalLink, Download, Copy, Check, X
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { renderArtifact, getArtifactLabel, renderArtifactPreview } from './ArtifactRenderers';
import { formatContentForCopy } from '@/lib/format';
import { useClipboard } from '@/hooks/useClipboard';
import styles from './ArtifactCard.module.css';
import type { ArtifactType } from '@/types';

interface ArtifactCardProps {
  type: ArtifactType;
  content: Record<string, unknown>;
  variant?: 'grid' | 'chat';
  onCardClick?: () => void;
  onRegenerate?: () => void;
  onRefine?: (instruction: string) => void;
  onExport?: (format: string) => void;
  isGenerating?: boolean;
  isRefining?: boolean;
  isNew?: boolean;
}

export const ArtifactCard = memo(function ArtifactCard({
  type, content, variant = 'grid', onCardClick, onRegenerate, onRefine, onExport,
  isGenerating, isRefining, isNew
}: ArtifactCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const label = getArtifactLabel(type);
  const { copied, copy } = useClipboard();

  useEffect(() => {
    if (isNew) {
      setShowNewBadge(true);
      const timer = setTimeout(() => setShowNewBadge(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  useEffect(() => {
    if (openModal) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpenModal(false);
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [openModal]);

  const handleCopy = async () => {
    const text = formatContentForCopy(content, label);
    await copy(text);
  };

  const isChat = variant === 'chat';
  const cardClass = [
    styles.documentCard,
    isChat ? styles.chatCard : '',
    expanded ? styles.expanded : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={cardClass} role="region" aria-label={`${label} artifact`}>
        <div className={styles.toolbar}>
          <span className={styles.toolbarType}>{label}</span>
          <div className={styles.toolbarActions}>
            {showNewBadge && <span className={styles.newBadge}>New</span>}
            <Tooltip content="Open">
              <button
                className={styles.toolbarBtn}
                onClick={() => setOpenModal(true)}
                aria-label="Open artifact"
              >
                <ExternalLink size={15} />
              </button>
            </Tooltip>

            {onRegenerate && (
              <Tooltip content="Regenerate">
                <button
                  className={styles.toolbarBtn}
                  onClick={() => onRegenerate()}
                  disabled={isGenerating}
                  aria-label="Regenerate"
                >
                  <RefreshCw size={15} className={isGenerating ? styles.spinning : ''} />
                </button>
              </Tooltip>
            )}

            <Tooltip content={expanded ? 'Collapse' : 'Preview'}>
              <button
                className={styles.toolbarBtn}
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? 'Collapse' : 'Preview'}
              >
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </Tooltip>
          </div>
        </div>

        {expanded ? (
          <div className={styles.expandedContent}>
            {renderArtifact(type, content)}
          </div>
        ) : (
          <div
            className={styles.previewArea}
            onClick={() => { if (onCardClick) onCardClick(); else setExpanded(true); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onCardClick) onCardClick(); else setExpanded(true);
              }
            }}
            aria-label={onCardClick ? 'Open artifact' : 'Expand artifact'}
          >
            {renderArtifactPreview(type, content)}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.footerMeta}>
            <span className={styles.footerType}>{label}</span>
            <span className={styles.footerVersion}>v1</span>
          </div>
          <div className={styles.footerActions}>
            <Tooltip content={copied ? 'Copied' : 'Copy'}>
              <button
                className={styles.footerBtn}
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                aria-label={copied ? 'Copied' : 'Copy'}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </Tooltip>
            {onExport && (
              <div style={{ position: 'relative' }}>
                <Tooltip content="Export">
                  <button
                    className={styles.footerBtn}
                    onClick={(e) => { e.stopPropagation(); setExportOpen(!exportOpen); }}
                    onKeyDown={(e) => { if (e.key === 'Escape') setExportOpen(false); }}
                    aria-label="Export"
                    aria-expanded={exportOpen}
                  >
                    <Download size={13} />
                  </button>
                </Tooltip>
                {exportOpen && (
                  <div
                    className={styles.exportDropdown}
                    role="menu"
                    aria-label="Export formats"
                  >
                    {['pdf', 'docx', 'markdown', 'pptx'].map((fmt) => (
                      <button
                        key={fmt}
                        className={styles.exportDropdownItem}
                        onClick={() => { onExport(fmt); setExportOpen(false); }}
                        onKeyDown={(e) => { if (e.key === 'Escape') setExportOpen(false); }}
                        role="menuitem"
                      >
                        {fmt === 'markdown' ? 'MD' : fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {onRefine && (
              <button
                className={styles.footerBtn}
                onClick={() => {
                  if (expanded) {
                    document.getElementById(`refine-input-${type}`)?.focus();
                  } else {
                    setExpanded(true);
                    setTimeout(() => document.getElementById(`refine-input-${type}`)?.focus(), 100);
                  }
                }}
                disabled={isRefining}
                aria-label="Refine"
              >
                {isRefining ? '...' : 'Refine'}
              </button>
            )}
          </div>
        </div>

        {expanded && onRefine && (
          <div className={styles.refineArea}>
            <input
              id={`refine-input-${type}`}
              className={styles.refineInput}
              placeholder="Refine this artifact..."
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              aria-label="Refinement instructions"
            />
            <Tooltip content="Submit refinement">
              <button
                className={styles.refineBtn}
                onClick={() => { onRefine(refineInput); setRefineInput(''); }}
                disabled={isRefining || !refineInput.trim()}
                aria-label="Submit refinement"
              >
                {isRefining ? '...' : 'Refine'}
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {openModal && (
        <div
          className={styles.overlay}
          onClick={() => setOpenModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="artifact-modal-title"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalToolbar}>
              <h2 id="artifact-modal-title" className={styles.modalTitle}>{label}</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setOpenModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {renderArtifact(type, content)}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
