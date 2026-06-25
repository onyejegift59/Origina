'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api/client';
import type { AiConversation } from '@/types';

interface UseConversationOptions {
  projectId: string;
  onArtifactsChange: () => void;
}

interface UseConversationReturn {
  messages: AiConversation[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  isStreaming: boolean;
  streamingContent: string;
  handleSend: (message: string) => Promise<void>;
  handleStop: () => void;
  handleRetry: () => void;
}

export function useConversation({ projectId, onArtifactsChange }: UseConversationOptions): UseConversationReturn {
  const [messages, setMessages] = useState<AiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchConversation = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error('Failed to load conversation');
        const result = await res.json();
        if (result.success) {
          setMessages(result.data.conversation || []);
        }
      } catch {
        setError('Unable to load conversation. Please try again.');
      }
      setLoading(false);
    };

    fetchConversation();
  }, [projectId]);

  const handleSend = useCallback(async (message: string) => {
    const userMsg: AiConversation = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      role: 'user',
      message,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setIsStreaming(true);
    setStreamingContent('');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await api.post('/api/ai/assistant-stream', { projectId, message }, {
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error('Failed to get response');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.content || '';
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      if (fullContent) {
        const aiMsg: AiConversation = {
          id: `resp-${Date.now()}`,
          project_id: projectId,
          role: 'assistant',
          message: fullContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        onArtifactsChange();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        project_id: projectId,
        role: 'assistant',
        message: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      }]);
    }

    setStreamingContent('');
    setIsStreaming(false);
    setSending(false);
    abortRef.current = null;
  }, [projectId, onArtifactsChange]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    const fetchConversation = async () => {
      try {
        const res = await api.get(`/api/projects/${projectId}`);
        const result = await res.json();
        if (result.success) {
          setMessages(result.data.conversation || []);
        }
      } catch {
        setError('Unable to load conversation.');
      }
      setLoading(false);
    };
    fetchConversation();
  }, [projectId]);

  return {
    messages,
    loading,
    error,
    sending,
    isStreaming,
    streamingContent,
    handleSend,
    handleStop,
    handleRetry,
  };
}
