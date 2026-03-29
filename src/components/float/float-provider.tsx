import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { FloatEngine } from './float-engine.ts';
import { FloatContext } from './float-context.ts';
import type { FloatProviderHandle, FloatProviderProps, Size, Vec2 } from './float-types.ts';

export const FloatProvider = forwardRef<FloatProviderHandle, FloatProviderProps>(function FloatProvider({ speed, children }, ref) {
  const engineRef = useRef<FloatEngine | null>(null);
  const animRef = useRef<number>(0);

  if (engineRef.current == null) {
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

  const setSize = useCallback((id: string, size: Size) => {
    engineRef.current?.setSize(id, size);
  }, []);

  const setHome = useCallback((id: string, position: Vec2) => {
    engineRef.current?.setHome(id, position);
  }, []);

  const returnHome = useCallback((onComplete?: () => void) => {
    engineRef.current?.returnHome(onComplete);
  }, []);

  useImperativeHandle(ref, () => ({ returnHome }), [returnHome]);

  return (
    <FloatContext value={{ register, unregister, setFrozen, setSize, setHome, returnHome }}>
      {children}
    </FloatContext>
  );
});
