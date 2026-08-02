import type { ReactNode } from 'react';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface FloatItemOrigin {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FloatingItem {
  id: string;
  position: Vec2;
  velocity: Vec2;
  direction: Vec2;
  size: Size;
  frozen: boolean;
  element: HTMLElement | null;
  homePosition: Vec2;
}

export interface FloatContextValue {
  register: (
    id: string,
    element: HTMLElement,
    initialPosition?: Vec2,
  ) => void;
  unregister: (id: string) => void;
  setFrozen: (id: string, frozen: boolean) => void;
  setSize: (id: string, size: Size) => void;
  setHome: (id: string, position: Vec2) => void;
  returnHome: (onComplete?: () => void) => void;
}

export interface FloatProviderProps {
  speed: number;
  // Halts the whole tick loop (all items, not just the clicked one) — used
  // while a modal is open so nothing keeps moving behind its blurred
  // backdrop, which is otherwise expensive to keep recompositing.
  paused?: boolean;
  children: ReactNode;
}

export interface FloatProviderHandle {
  returnHome: (onComplete?: () => void) => void;
}

export interface FloatItemProps {
  initialPosition?: Vec2;
  freezeOnHover?: boolean;
  frozen?: boolean;
  chaosActive?: boolean;
  staggerIndex?: number;
  onClick?: (origin: FloatItemOrigin) => void;
  children: ReactNode;
}
