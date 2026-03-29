import styles from './chat.module.scss';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`${styles.message} ${role === 'user' ? styles.messageUser : styles.messageAssistant}`}
    >
      <span className={styles.messageLabel}>
        {role === 'user' ? 'you' : 'colbot'}
      </span>
      <p className={styles.messageContent}>{content}</p>
    </div>
  );
}
