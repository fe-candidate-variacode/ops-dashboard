import { act, render, screen } from '@testing-library/react';
import { makeNode } from '../../test/factories';
import { telemetryStore } from '../telemetry/telemetryStore';
import { Overview } from './Overview';

describe('Overview', () => {
  afterEach(() => telemetryStore.setState({ nodesById: {}, history: {} }));

  it('shows placeholders before telemetry arrives', () => {
    render(<Overview />);

    expect(screen.getByText('Total Active Nodes').nextElementSibling).toHaveTextContent('0');
    expect(screen.getByText('Average System Latency').nextElementSibling).toHaveTextContent('—');
  });

  it('summarises the fleet', () => {
    render(<Overview />);

    act(() =>
      telemetryStore.getState().applyBatch({
        replace: true,
        nodes: [
          makeNode({ nodeId: 'a', status: 'CRITICAL', latencyMs: 300 }),
          makeNode({ nodeId: 'b', status: 'OK', latencyMs: 100 }),
          makeNode({ nodeId: 'c', status: 'CRITICAL', latencyMs: 200 }),
        ],
      }),
    );

    expect(screen.getByText('Total Active Nodes').nextElementSibling).toHaveTextContent('3');
    expect(screen.getByText('Critical Alerts').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Average System Latency').nextElementSibling).toHaveTextContent(
      '200 ms',
    );
  });

  it('reacts to later updates', () => {
    render(<Overview />);
    act(() =>
      telemetryStore.getState().applyBatch({
        replace: true,
        nodes: [makeNode({ nodeId: 'a', status: 'OK' })],
      }),
    );
    expect(screen.getByText('Critical Alerts').nextElementSibling).toHaveTextContent('0');

    act(() =>
      telemetryStore.getState().applyBatch({
        replace: false,
        nodes: [makeNode({ nodeId: 'a', status: 'CRITICAL' })],
      }),
    );

    expect(screen.getByText('Critical Alerts').nextElementSibling).toHaveTextContent('1');
  });
});
