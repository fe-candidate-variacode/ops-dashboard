import type { NodeId, NodeMetric, ServerMessage, TelemetryBatch } from './types';

/**
 * Coalesces incoming messages between flushes: for each node only the latest
 * value survives, so memory is bounded by the node count, not the message rate.
 */
export class UpdateBuffer {
  private pending = new Map<NodeId, NodeMetric>();
  private replace = false;

  push(message: ServerMessage): void {
    if (message.type === 'snapshot') {
      // A snapshot supersedes everything received before it.
      this.pending.clear();
      this.replace = true;
    }
    for (const node of message.nodes) {
      this.pending.set(node.nodeId, node);
    }
  }

  /** Returns everything accumulated since the last drain, or `null` when idle. */
  drain(): TelemetryBatch | null {
    if (!this.replace && this.pending.size === 0) return null;
    const batch: TelemetryBatch = { nodes: [...this.pending.values()], replace: this.replace };
    this.pending = new Map();
    this.replace = false;
    return batch;
  }
}
