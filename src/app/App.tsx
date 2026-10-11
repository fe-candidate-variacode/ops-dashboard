import { useServerProbe } from './useServerProbe';

export function App() {
  const { status, lastMessage } = useServerProbe();

  return (
    <main>
      <h1>Fleet Operations Dashboard</h1>
      <p>
        Mock server connection: <strong>{status}</strong>
      </p>
      {lastMessage && <pre>{lastMessage}</pre>}
    </main>
  );
}
