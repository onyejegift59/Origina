'use client';

import { useState, useCallback, memo } from 'react';
import { Copy, Check } from 'lucide-react';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = memo(function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [content]);

  if (isUser) {
    return (
      <div className={styles.userRow} role="listitem">
        <div className={styles.userBubble}>
          <div className={styles.userText}>{content}</div>
          <button
            className={styles.copyBtn}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy message'}
            title={copied ? 'Copied' : 'Copy'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.assistantRow} role="listitem">
      <div className={styles.assistantBubble}>
        <div className={styles.assistantText}>{content}</div>
        <button
          className={styles.assistantCopyBtn}
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy message'}
          title={copied ? 'Copied' : 'Copy'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        {isStreaming && <span className={styles.cursor} aria-hidden="true">|</span>}
      </div>
    </div>
  );
});
