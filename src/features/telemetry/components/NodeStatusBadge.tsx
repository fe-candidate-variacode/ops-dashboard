import { Badge } from '../../../design-system';
import type { BadgeTone } from '../../../design-system';
import type { NodeStatus } from '../types';

const PRESENTATION: Record<NodeStatus, { tone: BadgeTone; icon: string; label: string }> = {
  OK: { tone: 'ok', icon: '✓', label: 'OK' },
  WARNING: { tone: 'warning', icon: '▲', label: 'Warning' },
  CRITICAL: { tone: 'critical', icon: '✖', label: 'Critical' },
};

export function NodeStatusBadge({ status }: { status: NodeStatus }) {
  const { tone, icon, label } = PRESENTATION[status];
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}
