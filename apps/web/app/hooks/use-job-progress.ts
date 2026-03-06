'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type StepStatus =
  | 'pending'
  | 'running'
  | 'complete'
  | 'completed'
  | 'error';

export interface ProgressStep {
  step: string;
  status: StepStatus;
  message: string;
  total?: number;
}

export interface UseJobProgressReturn {
  steps: ProgressStep[];
  isComplete: boolean;
  error: string | null;
  connect: (jobId: string) => void;
  disconnect: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_API === 'true';

export function useJobProgress(): UseJobProgressReturn {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const connect = useCallback(
    (jobId: string) => {
      disconnect();

      setSteps([]);
      setIsComplete(false);
      setError(null);

      const sseUrl = MOCK_MODE
        ? `/api/mock-sse/${jobId}`
        : `${API_URL}/jobs/${jobId}/progress`;
      const es = new EventSource(sseUrl);
      esRef.current = es;

      es.addEventListener('progress', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as {
            step: string;
            status: StepStatus;
            message: string;
            total?: number;
          };
          setSteps((prev) => {
            const idx = prev.findIndex((s) => s.step === data.step);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = data;
              return next;
            }
            return [...prev, data];
          });
        } catch {
          // ignore malformed event
        }
      });

      es.addEventListener('error', (event: MessageEvent) => {
        setError(event.data ?? 'An error occurred');
        es.close();
        esRef.current = null;
      });

      es.addEventListener('complete', () => {
        setIsComplete(true);
        es.close();
        esRef.current = null;
      });

      es.onerror = () => {
        setError('Connection lost. Please try again.');
        es.close();
        esRef.current = null;
      };
    },
    [disconnect],
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { steps, isComplete, error, connect, disconnect };
}
