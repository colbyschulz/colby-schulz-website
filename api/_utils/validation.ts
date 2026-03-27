import type Anthropic from '@anthropic-ai/sdk';

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior)\s+instructions/i,
  /you\s+are\s+now\s+(a\s+)?(?!colby)/i,
  /forget\s+everything/i,
  /new\s+(system\s+)?prompt/i,
  /\[system\]/i,
  /<\s*system\s*>/i,
  /disregard\s+(your\s+)?(previous|prior|all)/i,
];

function hasInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

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
    if (content.length > 500) return 'Message too long (max 500 chars)';
    if (role === 'user' && hasInjection(content)) return 'Invalid message content';
    messages.push({ role, content });
  }

  if (messages.length === 0 || messages[0].role !== 'user') {
    return 'No valid messages';
  }

  return messages;
}
