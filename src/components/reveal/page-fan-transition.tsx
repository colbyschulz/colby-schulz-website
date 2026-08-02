import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './page-fan-transition.module.scss';

export function PageFanTransition({ origin, onDone }: RevealTransitionProps) {
  const { expanded, style } = useExpandOnMount(origin);

  return (
    <div
      className={`${styles.panel}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div className={`${styles.page} ${styles.pageBehind}`} />
      <div className={styles.page} />
    </div>
  );
}
