'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { ArrowUp, Menu } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './dashboard.module.css';

const MAX_IDEA_LENGTH = 10000;

export default function DashboardPage() {
  const [idea, setIdea] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    const trimmed = idea.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    setError(null);

    const name = trimmed.length > 40 ? trimmed.slice(0, 40) + '...' : trimmed;

    try {
      const res = await api.post('/api/projects', { name, idea: trimmed, problem_description: '' });

      const result = await res.json();
      if (result.success) {
        router.push(`/dashboard/${result.data.id}`);
      } else {
        throw new Error(result.error?.message ?? 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.');
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleMobileToggle = () => {
    window.dispatchEvent(new CustomEvent('sidebar:toggle'));
  };

  const charCount = idea.length;
  const isOverLimit = charCount > MAX_IDEA_LENGTH;

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
        <h1 className={styles.title}>What would you like to create today?</h1>
        <p className={styles.subtitle}>Describe your startup idea and Origina will help you build a product strategy.</p>

        <div className={styles.composer}>
          <textarea
            className={`${styles.textarea} ${isOverLimit ? styles.textareaError : ''}`}
            placeholder="e.g., A platform that connects freelance designers with early-stage startups..."
            value={idea}
            onChange={(e) => {
              if (e.target.value.length <= MAX_IDEA_LENGTH) {
                setIdea(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            rows={3}
            aria-label="Describe your startup idea"
          />
          <Tooltip content="Create project">
            <button
              className={styles.sendBtn}
              onClick={handleCreate}
              disabled={!idea.trim() || creating || isOverLimit}
              aria-label="Create project"
            >
              <ArrowUp size={18} />
            </button>
          </Tooltip>
        </div>

        <div className={styles.charCounter}>
          <span className={isOverLimit ? styles.charOver : ''}>
            {charCount}/{MAX_IDEA_LENGTH}
          </span>
        </div>

        {error && (
          <p className={styles.error} role="alert">{error}</p>
        )}

        {creating && (
          <p className={styles.creating} role="status" aria-live="polite">
            Creating your workspace...
          </p>
        )}
      </div>
    </div>
  );
}
