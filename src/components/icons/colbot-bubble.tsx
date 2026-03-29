import type { FloatItemContentProps } from '@/app';
import { FloatIcon } from './float-icon';
import styles from './colbot-bubble.module.scss';

export function ColbotBubble({ label }: FloatItemContentProps) {
  return (
    <FloatIcon
      label={label}
      viewBox="4 3 320 271"
      className={styles.wrapper}
      svgClassName={styles.svg}
      shapeClassName={styles.shape}
      labelClassName={styles.label}
    >
      <path d="M307,22 L255,36 L212,7 L157,45 L105,11 L67,45 L14,36 L35,79 L8,124 L35,154 L20,207 L69,187 L105,219 L139,181 L263,270 L178,183 L234,201 L258,175 L311,189 L298,147 L320,108 L298,71 Z" />
    </FloatIcon>
  );
}
