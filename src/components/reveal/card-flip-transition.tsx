import type { RevealTransitionProps } from './reveal-types.ts';
import { useExpandOnMount } from './use-expand-on-mount.ts';
import styles from './card-flip-transition.module.scss';

const FLOURISH_MS = 300;

export function CardFlipTransition({ origin, onDone }: RevealTransitionProps) {
  const { flourishing, expanded, style } = useExpandOnMount(origin, FLOURISH_MS);

  return (
    <div
      className={`${styles.stage}${expanded ? ` ${styles.expanded}` : ''}`}
      style={style}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'width') onDone();
      }}
    >
      <div className={`${styles.card}${flourishing ? ` ${styles.cardFlipped}` : ''}`} />
    </div>
  );
}
