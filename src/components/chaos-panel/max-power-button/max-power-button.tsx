import styles from './max-power-button.module.scss';

interface MaxPowerButtonProps {
  onClick: () => void;
}

export function MaxPowerButton({ onClick }: MaxPowerButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} aria-label="Max power">
      <span className={styles.disc} aria-hidden="true" />
      <span className={styles.label}>max power!!</span>
    </button>
  );
}
