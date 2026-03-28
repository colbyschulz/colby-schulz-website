import styles from './chaos-button.module.scss';

interface ChaosButtonProps {
  onClick: () => void;
}

export function ChaosButton({ onClick }: ChaosButtonProps) {
  return (
    <div className={styles.wrapper}>
      <button className={styles.button} onClick={onClick}>
        <span className={styles.label}>activate chaos mode</span>
      </button>
    </div>
  );
}
