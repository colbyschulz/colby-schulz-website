import type { FloatItemContentProps } from '@/app';
import { FloatIcon } from './float-icon';
import styles from './contact-envelope.module.scss';

export function ContactEnvelope({ label }: FloatItemContentProps) {
  return (
    <FloatIcon
      label={label}
      viewBox="21 81 358 198"
      className={styles.wrapper}
      svgClassName={styles.svg}
      shapeClassName={styles.shape}
      labelClassName={styles.label}
    >
      <path d="M 25,85 L 375,85 L 375,275 L 25,275 Z" />
      <path d="M 30,90 L 200,190 L 370,90" />
    </FloatIcon>
  );
}
