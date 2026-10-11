import type { ReactNode } from 'react';
import styles from './Table.module.css';

interface TableProps {
  /** Accessible table name; rendered as a visually hidden caption. */
  caption: string;
  children: ReactNode;
}

export function Table({ caption, children }: TableProps) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export type SortDirection = 'ascending' | 'descending';

interface SortableHeaderProps {
  children: ReactNode;
  /** `null` when the table is not sorted by this column. */
  direction: SortDirection | null;
  onSort: () => void;
  align?: 'start' | 'end';
}

export function SortableHeader({
  children,
  direction,
  onSort,
  align = 'start',
}: SortableHeaderProps) {
  const indicator = direction === 'ascending' ? '▲' : direction === 'descending' ? '▼' : '↕';

  return (
    <th scope="col" aria-sort={direction ?? 'none'} className={styles.th} data-align={align}>
      <button type="button" className={styles.sortButton} onClick={onSort}>
        {children}
        <span aria-hidden="true" className={styles.indicator} data-active={direction !== null}>
          {indicator}
        </span>
      </button>
    </th>
  );
}
