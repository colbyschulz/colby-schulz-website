import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './envelope-transition.module.scss';

const FLOURISH_MS = 300;

export function EnvelopeTransition({ origin, onDone }: RevealTransitionProps) {
  const { flourishing, expanded, style } = useExpandOnMount(origin, FLOURISH_MS);

  return (
    <div
      className={`${styles.panel}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div className={styles.body} />
      <div className={`${styles.flap}${flourishing ? ` ${styles.open}` : ''}`} />
    </div>
  );
}
