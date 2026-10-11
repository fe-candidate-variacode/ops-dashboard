import { useEffect, useState } from 'react';

export type ProbeStatus = 'connecting' | 'connected' | 'disconnected';

export interface ServerProbe {
  status: ProbeStatus;
  lastMessage: string | null;
}

/**
 * Phase 0 only: opens a raw WebSocket to prove the /ws proxy chain works.
 * Replaced by TelemetryClient + store in phase 1.
 */
export function useServerProbe(path = '/ws'): ServerProbe {
  const [probe, setProbe] = useState<ServerProbe>({ status: 'connecting', lastMessage: null });

  useEffect(() => {
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${scheme}://${window.location.host}${path}`);

    socket.onopen = () => setProbe((p) => ({ ...p, status: 'connected' }));
    socket.onmessage = (event: MessageEvent<string>) =>
      setProbe((p) => ({ ...p, lastMessage: event.data }));
    socket.onclose = () => setProbe((p) => ({ ...p, status: 'disconnected' }));

    return () => socket.close();
  }, [path]);

  return probe;
}
