import { useCallback, useState } from 'react';
import type { FloatItemOrigin } from '../components/float/float-types.ts';
import type { ModalOrigin } from '../components/modal/modal.types.ts';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion.ts';

export interface RevealingState {
  key: string;
  rect: FloatItemOrigin;
}

export interface ActiveModal {
  key: string;
  origin: ModalOrigin;
}

function centerOf(rect: FloatItemOrigin): ModalOrigin {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function useRevealOrchestration() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [revealing, setRevealing] = useState<RevealingState | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);

  const startReveal = useCallback(
    (key: string, rect: FloatItemOrigin) => {
      if (prefersReducedMotion) {
        setActiveModal({ key, origin: centerOf(rect) });
        return;
      }
      setRevealing({ key, rect });
    },
    [prefersReducedMotion],
  );

  const finishReveal = useCallback(() => {
    setRevealing((current) => {
      if (!current) return current;
      setActiveModal({ key: current.key, origin: centerOf(current.rect) });
      return null;
    });
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  return { revealing, activeModal, startReveal, finishReveal, closeModal };
}
