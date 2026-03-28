import type Anthropic from '@anthropic-ai/sdk';

/**
 * Parse and validate the request body into a safe messages array.
 * Returns the validated messages or a string describing the error.
 */
export function validateMessages(
  body: unknown,
): Anthropic.MessageParam[] | string {
  if (!body || typeof body !== 'object' || !('messages' in body)) {
    return 'Missing messages';
  }

  const rawMessages = (body as { messages: unknown }).messages;
  if (!Array.isArray(rawMessages)) {
    return 'Invalid messages';
  }

  const messages: Anthropic.MessageParam[] = [];
  for (const msg of rawMessages.slice(-10)) {
    if (!msg || typeof msg !== 'object') continue;
    const { role, content } = msg as Record<string, unknown>;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;
    if (role === 'user' && content.length > 500) return 'Message too long (max 500 chars)';
    messages.push({ role, content });
  }

  if (messages.length === 0 || messages[0].role !== 'user') {
    return 'No valid messages';
  }

  return messages;
}
