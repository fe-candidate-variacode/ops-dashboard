import { act, render, screen } from '@testing-library/react';
import { makeNode } from '../test/factories';
import { telemetryStore } from '../features/telemetry/telemetryStore';
import { App } from './App';

describe('App', () => {
  afterEach(() => {
    telemetryStore.setState({ nodesById: {}, history: {}, connectionStatus: 'connecting' });
  });

  it('renders the heading and the connection state', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /fleet operations dashboard/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Connecting')).toBeInTheDocument();
  });

  it('summarises the fleet from the store', () => {
    render(<App />);

    act(() => {
      telemetryStore.getState().applyBatch({
        replace: true,
        nodes: [
          makeNode({ nodeId: 'a', status: 'CRITICAL' }),
          makeNode({ nodeId: 'b', status: 'OK' }),
        ],
      });
    });

    expect(screen.getByText(/2 nodes · 1 critical/)).toBeInTheDocument();
  });
});
