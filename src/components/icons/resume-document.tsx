import type { FloatItemContentProps } from '@/app';
import { FloatIcon } from './float-icon';
import styles from './resume-document.module.scss';

export function ResumeDocument({ label }: FloatItemContentProps) {
  return (
    <FloatIcon
      label={label}
      viewBox="21 11 258 332"
      className={styles.wrapper}
      svgClassName={styles.svg}
      shapeClassName={styles.shape}
      labelClassName={styles.label}
    >
      <path d="M 25,15 L 275,15 L 275,339 L 25,339 Z" />
      <circle cx="70" cy="70" r="25" />
      <path d="M 115,70 L 235,70" />
      <path d="M 45,140 L 255,140" />
      <path d="M 45,165 L 225,165" />
      <path d="M 45,260 L 255,260" />
      <path d="M 45,285 L 205,285" />
    </FloatIcon>
  );
}
