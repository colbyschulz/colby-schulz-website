import type { ReactNode } from 'react';

export interface ModalOrigin {
  x: number;
  y: number;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  buttonText: string;
  origin: ModalOrigin;
  children: ReactNode;
  // Rendered next to the title, outside the scrolling body — for controls
  // (e.g. zoom) that need to stay reachable regardless of scroll position,
  // without overlapping content the way a sticky element inside the body
  // would. Modal doesn't know or care what's inside.
  headerActions?: ReactNode;
}
