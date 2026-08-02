import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './card-flip-transition.module.scss';

export function CardFlipTransition({ origin, onDone }: RevealTransitionProps) {
  const { expanded, style } = useExpandOnMount(origin);

  return (
    <div
      className={`${styles.stage}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div className={`${styles.card}${expanded ? ` ${styles.cardFlipped}` : ''}`} />
    </div>
  );
}
