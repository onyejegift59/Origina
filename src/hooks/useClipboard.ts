'use client';

import { useState, useCallback } from 'react';

export function useClipboard(): {
  copied: boolean;
  setCopied: (value: boolean) => void;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, []);

  return { copied, setCopied, copy };
}
