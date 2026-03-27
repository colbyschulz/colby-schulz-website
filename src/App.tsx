import { useEffect, useRef } from 'react';
import styles from './App.module.scss';

const SPEED = 2;

function App() {
  const textRef = useRef<HTMLHeadingElement>(null);
  const posRef = useRef({ x: 100, y: 100 });
  const velRef = useRef({ x: SPEED, y: SPEED });
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
        posRef.current.x = Math.max(0, Math.min(posRef.current.x, w));
      }
      if (posRef.current.y <= 0 || posRef.current.y >= h) {
        velRef.current.y *= -1;
        posRef.current.y = Math.max(0, Math.min(posRef.current.y, h));
      }

      el.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className={styles.container}>
      <h1 ref={textRef} className={styles.name}>Colby Schulz</h1>
    </div>
  );
}

export default App;
