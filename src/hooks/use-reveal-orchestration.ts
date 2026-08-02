import { useCallback, useState } from 'react';
import type { FloatItemOrigin } from '../components/float/float-types.ts';
import type { ModalOrigin } from '../components/modal/modal.types.ts';

export interface ActiveModal {
  key: string;
  origin: ModalOrigin;
}

function centerOf(rect: FloatItemOrigin): ModalOrigin {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function useRevealOrchestration() {
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);

  const openModal = useCallback((key: string, rect: FloatItemOrigin) => {
    setActiveModal({ key, origin: centerOf(rect) });
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  return { activeModal, openModal, closeModal };
}
