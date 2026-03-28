import type { ReactNode } from 'react';

export interface ModalOrigin {
  x: number;
  y: number;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  origin: ModalOrigin;
  children: ReactNode;
}
