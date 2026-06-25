'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './MessageComposer.module.css';

interface MessageComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isStreaming?: boolean;
  onStop?: () => void;
}

export const MessageComposer = memo(function MessageComposer({ onSend, disabled, placeholder, isStreaming, onStop }: MessageComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  };

  return (
    <div className={styles.composer}>
      <div className={styles.container}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || ''}
          rows={1}
          disabled={disabled}
          aria-label="Message input"
        />
        {isStreaming ? (
          <Tooltip content="Stop generating">
            <button
              className={styles.stopBtn}
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square size={14} />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Send message">
            <button
              className={styles.sendBtn}
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              aria-label="Send message"
            >
              <ArrowUp size={16} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
});
