/** Same-origin WebSocket URL: nginx (Docker) and Vite (dev) both proxy `/ws`. */
export function resolveTelemetryUrl(location: Pick<Location, 'protocol' | 'host'>): string {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${location.host}/ws`;
}
