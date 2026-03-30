import styles from './please-stop-button.module.scss';

interface PleaseStopButtonProps {
  onClick: () => void;
}

export function PleaseStopButton({ onClick }: PleaseStopButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} aria-label="Please stop">
      <span className={styles.pill} aria-hidden="true" />
      <span className={styles.label}>please stop</span>
    </button>
  );
}
