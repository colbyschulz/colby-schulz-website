import { useChat } from '../../hooks/use-chat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import styles from './chat.module.scss';

export function Chat() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    messagesEndRef,
    inputRef,
  } = useChat();

  return (
    <div className={styles.chat}>
      <div className={styles.messages}>
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
        <ChatInput
          ref={inputRef}
          value={input}
          onChange={setInput}
          onSubmit={sendMessage}
          disabled={isLoading}
        />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
