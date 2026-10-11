import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('App node selection', () => {
  afterEach(() => {
    telemetryStore.setState({ nodesById: {}, history: {}, connectionStatus: 'connecting' });
  });

  it('opens the detail panel from the table with the keyboard and follows the stream', async () => {
    const user = userEvent.setup();
    render(<App />);
    act(() =>
      telemetryStore.getState().applyBatch({
        replace: true,
        nodes: [
          makeNode({ nodeId: 'node-001', status: 'CRITICAL', cpu: 93 }),
          makeNode({ nodeId: 'node-002', status: 'OK', cpu: 21 }),
        ],
      }),
    );
    const detail = screen.getByRole('region', { name: 'Node detail' });
    expect(within(detail).getByText(/Select a node/)).toBeInTheDocument();

    screen.getByRole('button', { name: 'node-001' }).focus();
    await user.keyboard('{Enter}');

    expect(within(detail).getByRole('heading', { name: 'node-001' })).toBeInTheDocument();
    expect(within(detail).getAllByRole('img')).toHaveLength(2);

    act(() =>
      telemetryStore.getState().applyBatch({
        replace: false,
        nodes: [makeNode({ nodeId: 'node-001', status: 'CRITICAL', cpu: 97.7, timestamp: 2 })],
      }),
    );
    expect(
      within(detail).getByText('CPU', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent('97.7%');

    await user.click(within(detail).getByRole('button', { name: 'Close' }));
    expect(within(detail).getByText(/Select a node/)).toBeInTheDocument();
  });
});
