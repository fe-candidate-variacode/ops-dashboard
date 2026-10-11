import { act, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { makeNode } from '../../../test/factories';
import { telemetryStore } from '../../telemetry/telemetryStore';
import type { NodeMetric } from '../../telemetry/types';
import { useNodesViewStore } from '../nodesViewStore';
import { NodesPanel } from './NodesPanel';

const FLEET: NodeMetric[] = [
  makeNode({ nodeId: 'node-001', status: 'CRITICAL', cpu: 95, memory: 40, latencyMs: 700 }),
  makeNode({ nodeId: 'node-002', status: 'WARNING', cpu: 75, memory: 80, latencyMs: 300 }),
  makeNode({ nodeId: 'node-003', status: 'OK', cpu: 20, memory: 30, latencyMs: 90 }),
  makeNode({ nodeId: 'node-004', status: 'OK', cpu: 50, memory: 55, latencyMs: 120 }),
  makeNode({ nodeId: 'node-005', status: 'CRITICAL', cpu: 91, memory: 95, latencyMs: 400 }),
];

function seed(nodes: NodeMetric[] = FLEET) {
  act(() => telemetryStore.getState().applyBatch({ replace: true, nodes }));
}

function renderedNodeIds(): string[] {
  const table = screen.getByRole('table', { name: 'Fleet nodes' });
  return within(table)
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent ?? '');
}

function renderPanel(props: Partial<Parameters<typeof NodesPanel>[0]> = {}): {
  onSelectNode: ReturnType<typeof vi.fn>;
} {
  const onSelectNode = vi.fn();
  const element: ReactElement = (
    <NodesPanel selectedNodeId={null} onSelectNode={onSelectNode} {...props} />
  );
  render(element);
  return { onSelectNode };
}

describe('NodesPanel', () => {
  afterEach(() => {
    telemetryStore.setState({ nodesById: {}, history: {} });
    useNodesViewStore.getState().reset();
  });

  it('lists every node with its status as text', () => {
    renderPanel();
    seed();

    expect(renderedNodeIds()).toEqual(['node-001', 'node-002', 'node-003', 'node-004', 'node-005']);
    expect(screen.getByText('Showing 5 of 5 nodes')).toBeInTheDocument();
    expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
  });

  it('shows a waiting state before any telemetry arrives', () => {
    renderPanel();

    expect(screen.getByText('Waiting for telemetry…')).toBeInTheDocument();
  });

  it('filters to critical nodes only', async () => {
    const user = userEvent.setup();
    renderPanel();
    seed();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'CRITICAL');

    expect(renderedNodeIds()).toEqual(['node-001', 'node-005']);
    expect(screen.getByText('Showing 2 of 5 nodes')).toBeInTheDocument();
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    for (const row of rows) {
      expect(within(row).getByText('Critical')).toBeInTheDocument();
    }
  });

  it('sorts by CPU descending, then ascending, and exposes the order via aria-sort', async () => {
    const user = userEvent.setup();
    renderPanel();
    seed();

    await user.click(screen.getByRole('button', { name: /cpu/i }));
    expect(renderedNodeIds()).toEqual(['node-001', 'node-005', 'node-002', 'node-004', 'node-003']);
    expect(screen.getByRole('columnheader', { name: /cpu/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );

    await user.click(screen.getByRole('button', { name: /cpu/i }));
    expect(renderedNodeIds()).toEqual(['node-003', 'node-004', 'node-002', 'node-005', 'node-001']);
    expect(screen.getByRole('columnheader', { name: /cpu/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.getByRole('columnheader', { name: /memory/i })).toHaveAttribute(
      'aria-sort',
      'none',
    );
  });

  it('applies the filter and the sort together', async () => {
    const user = userEvent.setup();
    renderPanel();
    seed();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'CRITICAL');
    await user.click(screen.getByRole('button', { name: /memory/i }));

    expect(renderedNodeIds()).toEqual(['node-005', 'node-001']);
  });

  it('keeps the active sort while the stream updates values', async () => {
    const user = userEvent.setup();
    renderPanel();
    seed();
    await user.click(screen.getByRole('button', { name: /latency/i }));
    expect(renderedNodeIds()[0]).toBe('node-001');

    act(() =>
      telemetryStore.getState().applyBatch({
        replace: false,
        nodes: [makeNode({ nodeId: 'node-003', status: 'CRITICAL', latencyMs: 900 })],
      }),
    );

    expect(renderedNodeIds()[0]).toBe('node-003');
  });

  it('offers a way out when the filter matches nothing', async () => {
    const user = userEvent.setup();
    renderPanel();
    seed(FLEET.filter((node) => node.status !== 'WARNING'));

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'WARNING');

    expect(screen.getByText('No nodes match this filter.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all nodes' }));
    expect(renderedNodeIds()).toHaveLength(4);
  });

  it('selects a node with the mouse', async () => {
    const user = userEvent.setup();
    const { onSelectNode } = renderPanel();
    seed();

    await user.click(screen.getByRole('button', { name: 'node-001' }));

    expect(onSelectNode).toHaveBeenCalledWith('node-001');
  });

  it('selects a node with the keyboard', async () => {
    const user = userEvent.setup();
    const { onSelectNode } = renderPanel();
    seed();

    screen.getByRole('button', { name: 'node-003' }).focus();
    await user.keyboard('{Enter}');

    expect(onSelectNode).toHaveBeenCalledWith('node-003');
  });

  it('marks only the selected row as expanded', () => {
    renderPanel({ selectedNodeId: 'node-002' });
    seed();

    expect(screen.getByRole('button', { name: 'node-002' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'node-001' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
