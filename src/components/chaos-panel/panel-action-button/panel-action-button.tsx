import styles from './panel-action-button.module.scss';

interface PanelActionButtonProps {
  label: string;
  color: 'green' | 'red';
  onClick: () => void;
}

export function PanelActionButton({ label, color, onClick }: PanelActionButtonProps) {
  return (
    <button className={styles.button} data-color={color} onClick={onClick} aria-label={label}>
      <span className={styles.disc} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
