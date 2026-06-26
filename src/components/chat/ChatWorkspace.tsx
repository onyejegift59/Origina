'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { useConversation } from '@/hooks/useConversation';
import { useExport } from '@/hooks/useExport';
import { ChatMessage } from './ChatMessage';
import { ArtifactCard } from './ArtifactCard';
import { ArtifactChips, type ChipDef } from './ArtifactChips';
import { ArtifactsHub } from './ArtifactsHub';
import { MessageComposer } from './MessageComposer';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { ARTIFACT_TYPES } from '@/constants';
import { Menu } from 'lucide-react';
import type { ArtifactType } from '@/types';
import styles from './ChatWorkspace.module.css';

interface ArtifactData {
  type: ArtifactType;
  content: Record<string, unknown>;
}

interface ChatWorkspaceProps {
  projectId: string;
  projectName: string;
  projectIdea: string;
  artifacts: ArtifactData[];
  onArtifactsChange: () => void;
}

export function ChatWorkspace({ projectId, projectName, projectIdea, artifacts, onArtifactsChange }: ChatWorkspaceProps) {
  const [generatingArtifact, setGeneratingArtifact] = useState<ArtifactType | null>(null);
  const [refiningArtifact, setRefiningArtifact] = useState<ArtifactType | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { handleExport } = useExport(projectId);

  const {
    messages, loading, error, sending, isStreaming, streamingContent,
    handleSend, handleStop, handleRetry,
  } = useConversation({ projectId, onArtifactsChange });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || artifacts.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, artifacts.length, generatingArtifact, scrollToBottom]);

  const handleGenerateArtifact = useCallback(async (type: ArtifactType) => {
    setGeneratingArtifact(type);
    setGenerationError(null);

    try {
      await api.post('/api/ai/generate', { projectId, type });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setGenerationError(`Failed to generate ${type.replace('_', ' ')}. Please try again.`);
      console.error('[ChatWorkspace] Artifact generation failed:', message);
    }

    setGeneratingArtifact(null);
    onArtifactsChange();
  }, [projectId, onArtifactsChange]);

  const handleChipGenerate = useCallback((chip: ChipDef) => {
    handleGenerateArtifact(chip.id as ArtifactType);
  }, [handleGenerateArtifact]);

  const handleRefine = useCallback(async (type: ArtifactType, instruction: string) => {
    const artifact = artifacts.find((a) => a.type === type);
    const artifactContent = artifact?.content ?? {};
    setRefiningArtifact(type);

    try {
      await api.post('/api/ai/refine', { projectId, artifactType: type, artifactContent, instruction });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ChatWorkspace] Refine failed:', message);
    }

    setRefiningArtifact(null);
    onArtifactsChange();
  }, [projectId, artifacts, onArtifactsChange]);

  const hasMessages = messages.length > 0;
  const hasArtifacts = artifacts.length > 0;

  return (
    <div className={styles.workspace}>
      <div className={styles.mobileHeader}>
        <button
          className={styles.menuBtn}
          onClick={() => window.dispatchEvent(new CustomEvent('sidebar:toggle'))}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={styles.messages} ref={messagesContainerRef}>
        {loading ? (
          <div className={styles.skeletonConversation} role="status" aria-live="polite">
            <div className={styles.skeletonMessage}>
              <div className={styles.skeletonMessageAvatar} />
              <div className={styles.skeletonMessageContent}>
                <Skeleton height={12} width={80} />
                <SkeletonText lines={2} />
              </div>
            </div>
            <div className={`${styles.skeletonMessage} ${styles.skeletonMessageUser}`}>
              <div className={styles.skeletonMessageContent}>
                <Skeleton height={12} width={60} />
                <Skeleton height={12} width="70%" />
              </div>
              <div className={styles.skeletonMessageAvatar} />
            </div>
            <div className={styles.skeletonMessage}>
              <div className={styles.skeletonMessageAvatar} />
              <div className={styles.skeletonMessageContent}>
                <Skeleton height={12} width={90} />
                <SkeletonText lines={3} />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className={styles.errorState} role="alert">
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={handleRetry}>Retry</button>
          </div>
        ) : !hasMessages && !hasArtifacts ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <h2 className={styles.emptyTitle}>{projectName}</h2>
              <p className={styles.emptyText}>{projectIdea}</p>
              <p className={styles.emptyPrompt}>What would you like to create today?</p>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.welcome}>
              <h2 className={styles.welcomeTitle}>{projectName}</h2>
              <p className={styles.welcomeIdea}>{projectIdea}</p>
            </div>

            <div role="list" aria-label="Conversation messages">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.message} />
              ))}
              {isStreaming && streamingContent && (
                <ChatMessage role="assistant" content={streamingContent} isStreaming />
              )}
            </div>

            {generationError && (
              <div className={styles.errorState} role="alert">
                <p>{generationError}</p>
              </div>
            )}

            {artifacts.length > 0 && (
              <div className={styles.artifactSection}>
                <span className={styles.artifactSectionLabel}>Generated Artifacts</span>
                <div className={styles.artifactRow}>
                  {artifacts.map((artifact) => (
                    <div key={artifact.type} className={styles.artifactRowItem}>
                      <ArtifactCard
                        type={artifact.type}
                        content={artifact.content}
                        onRegenerate={() => handleGenerateArtifact(artifact.type)}
                        onRefine={(instruction) => handleRefine(artifact.type, instruction)}
                        onExport={(format) => handleExport(format)}
                        isGenerating={generatingArtifact === artifact.type}
                        isRefining={refiningArtifact === artifact.type}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatingArtifact && !artifacts.find((a) => a.type === generatingArtifact) && (
              <div className={styles.artifactSection}>
                <div className={styles.generatingIndicator}>
                  <div className={styles.spinning} aria-hidden="true" />
                  <span>Generating {generatingArtifact.replace('_', ' ')}...</span>
                </div>
              </div>
            )}

            {artifacts.length === 0 && hasMessages && (
              <div className={styles.artifactActions}>
                <span className={styles.artifactLabel}>Generate artifacts:</span>
                <div className={styles.artifactButtons}>
                  {(ARTIFACT_TYPES as unknown as ArtifactType[]).map((type) => (
                    <button
                      key={type}
                      className={styles.artifactBtn}
                      onClick={() => handleGenerateArtifact(type)}
                      disabled={generatingArtifact === type}
                      aria-label={`Generate ${type.replace('_', ' ')}`}
                    >
                      {type === 'startup_analysis' ? 'Analysis' :
                       type === 'health_score' ? 'Health' :
                       type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {hasArtifacts && (
          <ArtifactsHub projectId={projectId} artifacts={artifacts} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <ArtifactChips onGenerate={handleChipGenerate} disabled={sending || generatingArtifact !== null} />
      <MessageComposer
        onSend={handleSend}
        onStop={handleStop}
        disabled={sending}
        isStreaming={isStreaming}
      />
    </div>
  );
}
