import { useEffect, useRef, useState } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hey, I'm Colby's friend, Colbot! Feel free to ask me anything about him.",
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Add placeholder assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages
            .slice(nextMessages.findIndex((m) => m.role === 'user'))
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const detail = body.trim() || res.statusText || 'Unknown error';
        console.error('[chat] Request failed:', { status: res.status, detail });
        setMessages((prev) => prev.slice(0, -1));
        setError(`Error ${res.status}: ${detail}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + chunk,
          };
          return updated;
        });
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error('[chat] Unexpected error:', detail);
      setMessages((prev) => prev.slice(0, -1));
      setError(`Network error: ${detail}`);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    messagesEndRef,
    inputRef,
  };
}
