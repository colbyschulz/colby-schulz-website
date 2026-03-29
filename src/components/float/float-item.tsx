import { useContext, useEffect, useId, useRef } from 'react';
import { FloatContext } from './float-provider.tsx';
import type { FloatItemProps } from './float-types.ts';
import styles from './float-item.module.scss';

export function FloatItem({
  initialPosition,
  freezeOnHover = false,
  frozen = false,
  onClick,
  children,
}: FloatItemProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const { register, unregister, setFrozen, setSize } = useContext(FloatContext);

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

  // Keep the engine's collision box in sync with the DOM element size.
  // Needed because some items resize (e.g. ChaosPanel expanding).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize(id, { width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, setSize]);

  const handleMouseEnter = () => {
    if (freezeOnHover && !frozen) setFrozen(id, true);
  };

  const handleMouseLeave = () => {
    if (freezeOnHover && !frozen) setFrozen(id, false);
  };

  const handleClick = () => {
    if (!onClick || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onClick({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <div
      ref={ref}
      className={`${styles.item}${onClick ? ` ${styles.clickable}` : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick ? handleClick : undefined}
    >
      {/* Inner wrapper for hover scale — can't scale .item directly
          because the engine sets its transform (translate) every frame. */}
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
