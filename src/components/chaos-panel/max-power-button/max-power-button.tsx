import styles from './max-power-button.module.scss';

interface MaxPowerButtonProps {
  onClick: () => void;
}

export function MaxPowerButton({ onClick }: MaxPowerButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} aria-label="Max power">
      <svg
        className={styles.svg}
        viewBox="10 -5 445 218"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M448,74 L373,60 L400,6 L343,38 L343,9 L289,34 L257,0 L254,0 L212,41 L186,9 L160,52 L94,21 L93,27 L126,69 L125,71 L18,77 L18,81 L100,103 L43,129 L44,133 L123,131 L43,201 L45,205 L159,147 L165,180 L200,157 L209,191 L251,155 L283,183 L315,147 L375,180 L351,133 L439,131 L439,127 L369,94 L446,79 Z"
          fill="#f0c000"
          stroke="#1a1a1a"
          strokeWidth="5"
        />
      </svg>
      <span className={styles.label}>max power!!</span>
    </button>
  );
}
