import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './envelope-transition.module.scss';

export function EnvelopeTransition({ origin, onDone }: RevealTransitionProps) {
  const { expanded, style } = useExpandOnMount(origin);

  return (
    <div
      className={`${styles.panel}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div className={styles.body} />
      <div className={styles.flap} />
    </div>
  );
}
