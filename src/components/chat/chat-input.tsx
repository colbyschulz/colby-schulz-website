import { forwardRef } from 'react';
import styles from './chat.module.scss';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({ value, onChange, onSubmit, disabled }, ref) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <div className={styles.inputMessage}>
      <span className={styles.messageLabel}>you</span>
      <div className={styles.inputBubble}>
        <textarea
          ref={ref}
          className={styles.inputTextarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="say something..."
          disabled={disabled}
          rows={1}
          maxLength={500}
          enterKeyHint="send"
        />
        <button
          className={styles.inputSend}
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          →
        </button>
      </div>
    </div>
  );
});
