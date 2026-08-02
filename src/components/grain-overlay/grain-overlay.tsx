import { useEffect, useRef } from 'react';
import styles from './grain-overlay.module.scss';

interface GrainOverlayProps {
  opacity: number;
}

// Mobile screens have fewer canvas pixels (CSS px, not device px) so we can
// afford a baseline grain bump that's always on, independent of the slider.
const MOBILE_GRAIN_FLOOR = 0;
const MOBILE_DIM_FACTOR = 0.6; // dampens overall grain visibility on small screens

function getEffectiveOpacity(opacity: number): number {
  if (window.innerWidth <= 768) {
    return Math.max(opacity, MOBILE_GRAIN_FLOOR) * MOBILE_DIM_FACTOR;
  }
  return opacity;
}

// A handful of small precomputed noise tiles, cycled via CSS background-image
// swaps, instead of redrawing the whole viewport pixel-by-pixel every frame.
// The old per-pixel canvas redraw measured at 30-60ms+ per frame under real
// CPU load (via CDP throttling) — well past the 16.7ms/60fps and 41.7ms/24fps
// budgets, starving the main thread the float-item animation loop shares.
// Precomputing a small tile once and repeating it via CSS gets the same
// flicker at a tiny fraction of the cost.
const TILE_SIZE = 128; // CSS px, tiled across the viewport via background-repeat
const FRAME_COUNT = 8;
const FRAME_INTERVAL = 1000 / 24; // flicker rate, matches the old redraw rate

function generateNoiseTile(): string {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const image = ctx.createImageData(TILE_SIZE, TILE_SIZE);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.random() * 255;
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

export function GrainOverlay({ opacity }: GrainOverlayProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef(getEffectiveOpacity(opacity));

  useEffect(() => {
    opacityRef.current = getEffectiveOpacity(opacity);
    if (elementRef.current) {
      elementRef.current.style.opacity = String(opacityRef.current / 255);
    }
  }, [opacity]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.style.opacity = String(opacityRef.current / 255);

    const tiles = Array.from({ length: FRAME_COUNT }, () => `url(${generateNoiseTile()})`);
    element.style.backgroundImage = tiles[0];

    let frame: number;
    let lastTime = 0;
    let index = 0;

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (time - lastTime < FRAME_INTERVAL) return;
      lastTime = time;
      index = (index + 1) % FRAME_COUNT;
      element.style.backgroundImage = tiles[index];
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div ref={elementRef} className={styles.canvas} />;
}
