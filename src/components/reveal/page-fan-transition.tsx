import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './page-fan-transition.module.scss';

const FLOURISH_MS = 300;

export function PageFanTransition({ origin, onDone }: RevealTransitionProps) {
  const { flourishing, expanded, style } = useExpandOnMount(origin, FLOURISH_MS);

  return (
    <div
      className={`${styles.panel}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div
        className={`${styles.page} ${styles.pageBehind}${flourishing ? ` ${styles.settled}` : ''}`}
      />
      <div className={styles.page} />
    </div>
  );
}
