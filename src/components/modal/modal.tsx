import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { ModalProps } from './modal.types.ts';
import styles from './modal.module.scss';

export function Modal({ open, onClose, title, origin, children }: ModalProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Trigger open animation after mount
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      setClosing(false);
    }
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setVisible(false);
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (closing && e.propertyName === 'opacity') {
      setClosing(false);
      onClose();
    }
  };

  // transform-origin is relative to the element's own coordinate system.
  // The modal is positioned at left:50%, top:50% (before translate),
  // so the element's layout anchor is the viewport center.
  // To scale from the click origin, offset from that center point.
  const originX = origin.x - window.innerWidth / 2;
  const originY = origin.y - window.innerHeight / 2;
  const originStyle = {
    transformOrigin: `calc(50% + ${originX}px) calc(50% + ${originY}px)`,
  } as React.CSSProperties;

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className={`${styles.overlay}${visible ? ` ${styles.overlayVisible}` : ''}`} />
        <Dialog.Content
          ref={contentRef}
          className={`${styles.content}${visible ? ` ${styles.contentVisible}` : ''}`}
          style={originStyle}
          onTransitionEnd={handleTransitionEnd}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={handleClose}
          aria-describedby={undefined}
        >
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          <div className={styles.body}>{children}</div>
          <div className={styles.footer}>
            <button className={styles.closeButton} onClick={handleClose}>
              cool
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
