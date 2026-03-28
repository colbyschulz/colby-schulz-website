import type { IncomingMessage, ServerResponse } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import { corsHeaders } from './_utils/cors.js';
import { getSystemPrompt } from './_utils/content-loader.js';
import { validateMessages } from './_utils/validation.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const origin = (req.headers['origin'] as string) ?? '';
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    console.error('[chat] Method not allowed:', req.method);
    res.writeHead(405, cors);
    res.end('Method not allowed');
    return;
  }

  let body: unknown;
  try {
    body = await new Promise((resolve, reject) => {
      let data = '';
      req.setEncoding('utf-8');
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  } catch (err) {
    console.error('[chat] Failed to parse request body:', err);
    res.writeHead(400, cors);
    res.end('Invalid JSON');
    return;
  }

  const result = validateMessages(body);
  if (typeof result === 'string') {
    console.error('[chat] Message validation failed:', result);
    res.writeHead(400, cors);
    res.end(result);
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let stream;
  try {
    stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: getSystemPrompt(),
      messages: result,
    });
  } catch (err) {
    console.error('[chat] Failed to initiate Anthropic stream:', err);
    res.writeHead(500, cors);
    res.end('Failed to start stream');
    return;
  }

  res.writeHead(200, {
    ...cors,
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });

  try {
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(event.delta.text);
      }
    }
  } catch (err) {
    const isApiError = err instanceof Anthropic.APIError;
    console.error('[chat] Stream error:', {
      message: isApiError ? err.message : String(err),
      status: isApiError ? err.status : undefined,
      type: isApiError ? err.error : undefined,
    });
    // Headers already sent — can't change status code, just end
    res.end();
    return;
  }

  res.end();
}
