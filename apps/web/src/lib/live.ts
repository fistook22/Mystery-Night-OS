import { useEffect, useRef, useState } from 'react';
import type { ServerEvent, View } from '@mn/shared';
import { api } from './api';

export interface Live<V extends View> {
  view: V | null;
  error: string | null;
  connected: boolean;
  toast: { text: string; at: number } | null;
}

/**
 * Subscribes to the server's live view for a token. One EventSource per mount;
 * on error it is closed and reopened after a delay (never stacked), and every
 * reconnect receives a full view, so state is always resynced.
 */
export function useLive<V extends View>(token: string): Live<V> {
  const [view, setView] = useState<V | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState<Live<V>['toast']>(null);
  const retry = useRef(0);

  useEffect(() => {
    let es: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const open = () => {
      es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
      es.onopen = () => {
        retry.current = 0;
        setConnected(true);
      };
      es.onmessage = (m) => {
        const e = JSON.parse(m.data as string) as ServerEvent;
        if (e.type === 'view') {
          setView(e.view as V);
          setError(null);
        } else if (e.type === 'notify') {
          setToast({ text: e.text, at: e.at });
          navigator.vibrate?.([80, 60, 80]);
        }
      };
      es.onerror = () => {
        es?.close();
        setConnected(false);
        if (closed) return;
        // Distinguish a dead link (401) from a network blip.
        api('GET', '/api/view', { token }).catch((err: { status?: number; message: string }) => {
          if (err.status === 401) {
            closed = true;
            setError(err.message);
          }
        });
        const delay = Math.min(10_000, 1000 * 2 ** retry.current++);
        timer = setTimeout(() => !closed && open(), delay);
      };
    };
    open();
    return () => {
      closed = true;
      clearTimeout(timer);
      es?.close();
    };
  }, [token]);

  return { view, error, connected, toast };
}
