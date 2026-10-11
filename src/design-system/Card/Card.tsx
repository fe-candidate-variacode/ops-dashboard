import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  as?: 'div' | 'section';
  children: ReactNode;
  /** Accessible name when rendered as a `section` landmark. */
  'aria-labelledby'?: string;
  id?: string;
}

export function Card({ as: Tag = 'div', children, ...rest }: CardProps) {
  return (
    <Tag className={styles.card} {...rest}>
      {children}
    </Tag>
  );
}
