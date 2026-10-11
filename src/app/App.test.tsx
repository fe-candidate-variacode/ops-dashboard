import { act, render, screen } from '@testing-library/react';
import { makeNode } from '../test/factories';
import { telemetryStore } from '../features/telemetry/telemetryStore';
import { App } from './App';

describe('App', () => {
  afterEach(() => {
    telemetryStore.setState({ nodesById: {}, history: {}, connectionStatus: 'connecting' });
  });

  it('renders the heading, connection state and main regions', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /fleet operations dashboard/i }),
    ).toBeVisible();
    expect(screen.getByText('Connecting')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Fleet overview' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Nodes' })).toBeInTheDocument();
  });

  it('flags stale data when the connection drops', () => {
    render(<App />);

    act(() => {
      telemetryStore.getState().applyBatch({ replace: true, nodes: [makeNode()] });
      telemetryStore.getState().setConnectionStatus('reconnecting');
    });

    expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    expect(screen.getByText('Showing last known data')).toBeInTheDocument();
  });
});
