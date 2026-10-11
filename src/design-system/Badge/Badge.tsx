import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'ok' | 'warning' | 'critical';

interface BadgeProps {
  tone?: BadgeTone;
  /** Decorative glyph; the text label always carries the meaning. */
  icon?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', icon, children }: BadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {icon && (
        <span aria-hidden="true" className={styles.icon}>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
