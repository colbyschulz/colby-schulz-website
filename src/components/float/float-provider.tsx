import { createContext, useCallback, useEffect, useRef } from 'react';
import { FloatEngine } from './float-engine.ts';
import type { FloatContextValue, FloatProviderProps, Vec2 } from './float-types.ts';

const noop = () => {};

export const FloatContext = createContext<FloatContextValue>({
  register: noop,
  unregister: noop,
  setFrozen: noop,
  returnHome: noop,
});

export function FloatProvider({ speed, children }: FloatProviderProps) {
  const engineRef = useRef<FloatEngine | null>(null);
  const animRef = useRef<number>(0);

  if (!engineRef.current) {
    engineRef.current = new FloatEngine(
      speed,
      window.innerWidth,
      window.innerHeight,
    );
  }

  // Sync speed prop to engine
  useEffect(() => {
    engineRef.current?.setSpeed(speed);
  }, [speed]);

  // Sync viewport on resize
  useEffect(() => {
    const handleResize = () => {
      engineRef.current?.setViewport(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // rAF loop
  useEffect(() => {
    const animate = () => {
      const engine = engineRef.current;
      if (!engine) return;

      const positions = engine.tick();

      for (const [id, pos] of positions) {
        const item = engine.getItem(id);
        if (item?.element) {
          item.element.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const register = useCallback(
    (id: string, element: HTMLElement, initialPosition?: Vec2) => {
      const rect = element.getBoundingClientRect();
      engineRef.current?.register(
        id,
        { width: rect.width, height: rect.height },
        initialPosition,
        element,
      );
    },
    [],
  );

  const unregister = useCallback((id: string) => {
    engineRef.current?.unregister(id);
  }, []);

  const setFrozen = useCallback((id: string, frozen: boolean) => {
    engineRef.current?.setFrozen(id, frozen);
  }, []);

  const returnHome = useCallback((onComplete?: () => void) => {
    engineRef.current?.returnHome(onComplete);
  }, []);

  return (
    <FloatContext value={{ register, unregister, setFrozen, returnHome }}>
      {children}
    </FloatContext>
  );
}
