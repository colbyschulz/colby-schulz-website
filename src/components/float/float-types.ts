import type { ReactNode } from 'react';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
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
}

export interface FloatProviderProps {
  speed: number;
  children: ReactNode;
}

export interface FloatItemProps {
  initialPosition?: Vec2;
  freezeOnHover?: boolean;
  frozen?: boolean;
  onClick?: (origin: Vec2) => void;
  children: ReactNode;
}
