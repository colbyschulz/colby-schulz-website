import { useContext, useEffect, useId, useRef } from 'react';
import { FloatContext } from './float-provider.tsx';
import type { FloatItemProps } from './float-types.ts';
import styles from './float-item.module.scss';

export function FloatItem({
  initialPosition,
  freezeOnHover = false,
  frozen = false,
  children,
}: FloatItemProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const { register, unregister, setFrozen } = useContext(FloatContext);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    register(id, el, initialPosition);
    return () => unregister(id);
    // Register once on mount, unregister on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFrozen(id, frozen);
  }, [id, frozen, setFrozen]);

  const handleMouseEnter = () => {
    if (freezeOnHover && !frozen) setFrozen(id, true);
  };

  const handleMouseLeave = () => {
    if (freezeOnHover && !frozen) setFrozen(id, false);
  };

  return (
    <div
      ref={ref}
      className={styles.item}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
