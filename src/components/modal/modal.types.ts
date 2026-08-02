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
}
