import { useChat } from '../../hooks/use-chat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import styles from './chat.module.scss';

export function Chat() {
  const { messages, input, setInput, isLoading, error, sendMessage, messagesEndRef } =
    useChat();

  return (
    <div className={styles.chat}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.empty}>Ask me anything about Colby.</p>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <span className={styles.cursor} aria-label="Loading" />
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        disabled={isLoading}
      />
    </div>
  );
}
