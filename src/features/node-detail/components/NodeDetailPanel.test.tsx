import { Profiler } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeNode } from '../../../test/factories';
import { telemetryStore } from '../../telemetry/telemetryStore';
import { NodeDetailPanel } from './NodeDetailPanel';

function push(...nodes: ReturnType<typeof makeNode>[]) {
  act(() => telemetryStore.getState().applyBatch({ replace: false, nodes }));
}

describe('NodeDetailPanel', () => {
  beforeEach(() => {
    act(() =>
      telemetryStore.getState().applyBatch({
        replace: true,
        nodes: [
          makeNode({
            nodeId: 'node-001',
            status: 'CRITICAL',
            cpu: 91.5,
            memory: 70,
            latencyMs: 640,
          }),
          makeNode({ nodeId: 'node-002', status: 'OK', cpu: 20, memory: 30, latencyMs: 80 }),
        ],
      }),
    );
  });

  afterEach(() => telemetryStore.setState({ nodesById: {}, history: {} }));

  it('prompts to select a node when none is selected', () => {
    render(<NodeDetailPanel nodeId={null} onClose={() => {}} />);

    expect(screen.getByRole('region', { name: 'Node detail' })).toBeInTheDocument();
    expect(screen.getByText('Select a node to see its live telemetry.')).toBeInTheDocument();
  });

  it('shows the current telemetry of the selected node', () => {
    render(<NodeDetailPanel nodeId="node-001" onClose={() => {}} />);

    const panel = screen.getByRole('region', { name: 'Node detail' });
    expect(within(panel).getByRole('heading', { name: 'node-001' })).toBeInTheDocument();
    expect(within(panel).getByText('Critical')).toBeInTheDocument();
    expect(within(panel).getByText('CPU', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '91.5%',
    );
    expect(
      within(panel).getByText('Latency', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent('640 ms');
  });

  it('exposes each chart with a text alternative summarising its data', () => {
    render(<NodeDetailPanel nodeId="node-001" onClose={() => {}} />);
    push(makeNode({ nodeId: 'node-001', cpu: 60, latencyMs: 200, timestamp: 2 }));

    const cpuChart = screen.getByRole('img', { name: /^CPU over the last 2 samples/ });
    expect(cpuChart).toHaveAccessibleName(/now 60\.0%, min 60\.0%, max 91\.5%/);
    expect(
      screen.getByRole('img', { name: /^Latency over the last 2 samples/ }),
    ).toHaveAccessibleName(/now 200 ms, min 200 ms, max 640 ms/);
  });

  it('follows live updates of the selected node', () => {
    render(<NodeDetailPanel nodeId="node-001" onClose={() => {}} />);

    push(makeNode({ nodeId: 'node-001', status: 'OK', cpu: 12.3, timestamp: 2 }));

    const panel = screen.getByRole('region', { name: 'Node detail' });
    expect(within(panel).getByText('CPU', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '12.3%',
    );
    expect(within(panel).getByText('OK')).toBeInTheDocument();
  });

  it('grows the chart history as samples arrive', () => {
    render(<NodeDetailPanel nodeId="node-001" onClose={() => {}} />);

    for (let i = 0; i < 4; i += 1) {
      push(makeNode({ nodeId: 'node-001', cpu: 50 + i, timestamp: 10 + i }));
    }

    expect(screen.getByRole('img', { name: /^CPU over the last 5 samples/ })).toBeInTheDocument();
  });

  it('does not re-render when other nodes update', () => {
    const onRender = vi.fn();
    render(
      <Profiler id="detail" onRender={onRender}>
        <NodeDetailPanel nodeId="node-001" onClose={() => {}} />
      </Profiler>,
    );
    onRender.mockClear();

    push(makeNode({ nodeId: 'node-002', cpu: 55, timestamp: 2 }));
    expect(onRender).not.toHaveBeenCalled();

    push(makeNode({ nodeId: 'node-001', cpu: 55, timestamp: 2 }));
    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('says so when the selected node stops reporting', () => {
    render(<NodeDetailPanel nodeId="node-404" onClose={() => {}} />);

    expect(screen.getByText(/is no longer reporting/)).toBeInTheDocument();
  });

  it('closes via the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NodeDetailPanel nodeId="node-001" onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
