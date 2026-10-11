import { create } from 'zustand';
import { DEFAULT_SORT, nextSort } from './nodesView';
import type { SortKey, SortState, StatusFilter } from './nodesView';

/**
 * UI-only state for the nodes view. Deliberately separate from the telemetry
 * store so changing a filter never touches (or is slowed by) the stream.
 */
interface NodesViewState {
  statusFilter: StatusFilter;
  sort: SortState;
  setStatusFilter: (filter: StatusFilter) => void;
  toggleSort: (key: SortKey) => void;
  reset: () => void;
}

const INITIAL = { statusFilter: 'ALL', sort: DEFAULT_SORT } as const;

export const useNodesViewStore = create<NodesViewState>()((set) => ({
  ...INITIAL,
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  toggleSort: (key) => set((state) => ({ sort: nextSort(state.sort, key) })),
  reset: () => set(INITIAL),
}));
