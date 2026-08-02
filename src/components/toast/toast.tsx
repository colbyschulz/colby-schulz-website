import * as RadixToast from '@radix-ui/react-toast';
import styles from './toast.module.scss';

interface ToastProps {
  open: boolean;
  message: string;
  onOpenChange: (open: boolean) => void;
}

export function Toast({ open, message, onOpenChange }: ToastProps) {
  return (
    <RadixToast.Provider duration={2500}>
      <RadixToast.Root className={styles.root} open={open} onOpenChange={onOpenChange}>
        <RadixToast.Description className={styles.description}>
          {message}
        </RadixToast.Description>
      </RadixToast.Root>
      <RadixToast.Viewport className={styles.viewport} />
    </RadixToast.Provider>
  );
}
