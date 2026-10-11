import { computeAggregates } from './aggregates';
import type { FleetAggregates } from './aggregates';
import type { TelemetryState } from './telemetryStore';

/** Use with `useShallow`: the result only changes identity when a value changes. */
export function selectAggregates(state: TelemetryState): FleetAggregates {
  return computeAggregates(Object.values(state.nodesById));
}
