import type { ReactNode } from 'react';
import styles from './Stat.module.css';

interface StatProps {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'critical';
}

export function Stat({ label, value, tone = 'default' }: StatProps) {
  return (
    <dl className={styles.stat} data-tone={tone}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </dl>
  );
}
