import { createStore, useStore } from 'zustand';
import { RingBuffer } from '../../lib/ringBuffer';
import type { ConnectionStatus, HistoryPoint, NodeId, NodeMetric, TelemetryBatch } from './types';

export const HISTORY_CAPACITY = 60;

export interface TelemetryState {
  nodesById: Record<NodeId, NodeMetric>;
  history: Record<NodeId, RingBuffer<HistoryPoint>>;
  connectionStatus: ConnectionStatus;
  updatesPerSecond: number;
  applyBatch: (batch: TelemetryBatch) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setUpdatesPerSecond: (value: number) => void;
}

/** Factory so tests (and any future multi-instance use) get an isolated store. */
export function createTelemetryStore() {
  return createStore<TelemetryState>()((set) => ({
    nodesById: {},
    history: {},
    connectionStatus: 'connecting',
    updatesPerSecond: 0,

    // One `set` per batch: subscribers are notified once per flush, never per message.
    applyBatch: ({ nodes, replace }) =>
      set((state) => {
        const nodesById = replace ? {} : { ...state.nodesById };
        const history = replace ? {} : { ...state.history };

        for (const node of nodes) {
          nodesById[node.nodeId] = node;
          const point: HistoryPoint = {
            timestamp: node.timestamp,
            cpu: node.cpu,
            memory: node.memory,
            latencyMs: node.latencyMs,
          };
          const ring = history[node.nodeId] ?? new RingBuffer<HistoryPoint>(HISTORY_CAPACITY);
          history[node.nodeId] = ring.push(point);
        }

        return { nodesById, history };
      }),

    setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
    setUpdatesPerSecond: (updatesPerSecond) => set({ updatesPerSecond }),
  }));
}

export type TelemetryStore = ReturnType<typeof createTelemetryStore>;

export const telemetryStore: TelemetryStore = createTelemetryStore();

export function useTelemetryStore<T>(selector: (state: TelemetryState) => T): T {
  return useStore(telemetryStore, selector);
}
