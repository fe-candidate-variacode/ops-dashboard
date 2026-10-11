import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design-system/tokens.css';
import './app/global.css';
import { App } from './app/App';
import { resolveTelemetryUrl } from './features/telemetry/config';
import { startTelemetry } from './features/telemetry/startTelemetry';
import { telemetryStore } from './features/telemetry/telemetryStore';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// The connection lives outside React: it is started once, before the first render.
startTelemetry({ url: resolveTelemetryUrl(window.location), store: telemetryStore });

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
