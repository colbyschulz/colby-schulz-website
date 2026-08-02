import { useEffect, useState } from 'react';
import type { FloatItemOrigin } from '../float/float-types.ts';

export interface ExpandOnMountResult {
  flourishing: boolean;
  expanded: boolean;
  style: FloatItemOrigin | undefined;
}

// Two-phase sequence: the bespoke flourish (page tilt, envelope flap, card
// flip) plays first at the icon's own size, then the grow-to-modal-size
// transition starts. Running them concurrently made the flourish
// imperceptible — it was over before a real user's eye registered it.
export function useExpandOnMount(origin: FloatItemOrigin, flourishMs: number): ExpandOnMountResult {
  const [flourishing, setFlourishing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFlourishing(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!flourishing) return;
    const timer = setTimeout(() => setExpanded(true), flourishMs);
    return () => clearTimeout(timer);
  }, [flourishing, flourishMs]);

  return {
    flourishing,
    expanded,
    style: expanded ? undefined : origin,
  };
}
