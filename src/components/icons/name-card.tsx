import type { FloatItemContentProps } from '@/app';
import { FloatIcon } from './float-icon';
import styles from './name-card.module.scss';

export function NameCard({ label }: FloatItemContentProps) {
  return (
    <FloatIcon
      label={label}
      viewBox="16 -19 368 188"
      className={styles.wrapper}
      svgClassName={styles.svg}
      shapeClassName={styles.shape}
      labelClassName={styles.label}
    >
      <path d="M 175,15 L 175,-15 L 225,-15 L 225,15" />
      <path d="M 20,15 L 380,15 L 380,165 L 20,165 Z" />
      <circle cx="95" cy="75" r="20" />
      <path d="M 60,135 A 40 40 0 0 1 130,135" />
    </FloatIcon>
  );
}
