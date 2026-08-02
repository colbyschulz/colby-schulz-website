import type { FloatItemOrigin } from '../float/float-types.ts';

export type OpenAnimation = 'flip' | 'envelope' | 'pages';

export interface RevealTransitionProps {
  origin: FloatItemOrigin;
  onDone: () => void;
}
