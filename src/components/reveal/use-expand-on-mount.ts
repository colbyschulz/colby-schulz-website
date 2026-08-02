import { useEffect, useState } from 'react';
import type { FloatItemOrigin } from '../float/float-types.ts';

export interface ExpandOnMountResult {
  expanded: boolean;
  style: FloatItemOrigin | undefined;
}

export function useExpandOnMount(origin: FloatItemOrigin): ExpandOnMountResult {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return {
    expanded,
    style: expanded ? undefined : origin,
  };
}
