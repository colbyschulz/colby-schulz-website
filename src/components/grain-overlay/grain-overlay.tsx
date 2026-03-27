import { useEffect, useRef } from 'react';
import styles from './grain-overlay.module.scss';

interface GrainOverlayProps {
  opacity: number;
}

const FRAME_INTERVAL = 1000 / 24; // ~41.67ms — throttle to 24fps

export function GrainOverlay({ opacity }: GrainOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const opacityRef = useRef(opacity);

  useEffect(() => {
    opacityRef.current = opacity;
  }, [opacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame: number;
    let lastTime = 0;

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);

      if (time - lastTime < FRAME_INTERVAL) return;
      lastTime = time;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const d = ctx.createImageData(canvas.width, canvas.height);

      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() * 255;
        d.data[i] = v;
        d.data[i + 1] = v;
        d.data[i + 2] = v;
        d.data[i + 3] = opacityRef.current;
      }

      ctx.putImageData(d, 0, 0);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
