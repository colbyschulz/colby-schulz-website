import { useEffect, useRef } from 'react';
import styles from './bouncing-text.module.scss';

interface BouncingTextProps {
  text: string;
  speed?: number;
}

export function BouncingText({ text, speed = 2 }: BouncingTextProps) {
  const textRef = useRef<HTMLHeadingElement>(null);
  const posRef = useRef({ x: 100, y: 100 });
  const velRef = useRef({ x: speed, y: speed });
  const dirRef = useRef({ x: 1, y: 1 }); // last known direction, preserved when speed hits 0

  useEffect(() => {
    if (speed === 0) {
      velRef.current = { x: 0, y: 0 };
    } else {
      velRef.current = { x: dirRef.current.x * speed, y: dirRef.current.y * speed };
    }
  }, [speed]);

  useEffect(() => {
    let animId: number;

    const animate = () => {
      const el = textRef.current;
      if (!el) return;

      const w = window.innerWidth - el.offsetWidth;
      const h = window.innerHeight - el.offsetHeight;

      posRef.current.x += velRef.current.x;
      posRef.current.y += velRef.current.y;

      if (posRef.current.x <= 0 || posRef.current.x >= w) {
        velRef.current.x *= -1;
        dirRef.current.x *= -1;
        posRef.current.x = Math.max(0, Math.min(posRef.current.x, w));
      }
      if (posRef.current.y <= 0 || posRef.current.y >= h) {
        velRef.current.y *= -1;
        dirRef.current.y *= -1;
        posRef.current.y = Math.max(0, Math.min(posRef.current.y, h));
      }

      el.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <h1 ref={textRef} className={styles.text}>
      {text}
    </h1>
  );
}
