import styles from './contact-content.module.scss';

// Placeholder — replace hrefs/labels with real contact details.
export function ContactContent() {
  return (
    <div className={styles.contact}>
      <ul className={styles.links}>
        <li>
          <a href="mailto:colbyschulz@gmail.com" className={styles.link}>
            colbyschulz@gmail.com
          </a>
        </li>
        <li>
          <a
            href="https://linkedin.com/in/colbyschulz"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Linked In
          </a>
        </li>
        <li>
          <a
            href="https://github.com/colbyschulz"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Github
          </a>
        </li>
      </ul>
    </div>
  );
}
