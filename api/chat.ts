import type { IncomingMessage, ServerResponse } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import { corsHeaders } from './_utils/cors';
import { getSystemPrompt } from './_utils/content-loader';
import { isRateLimited } from './_utils/rate-limiter';
import { validateMessages } from './_utils/validation';

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
    res.writeHead(405, cors);
    res.end('Method not allowed');
    return;
  }

  const ip =
    ((req.headers['x-forwarded-for'] as string) ?? '').split(',')[0].trim() ||
    'unknown';
  if (isRateLimited(ip)) {
    res.writeHead(429, cors);
    res.end('Too many requests');
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
  } catch {
    res.writeHead(400, cors);
    res.end('Invalid JSON');
    return;
  }

  const result = validateMessages(body);
  if (typeof result === 'string') {
    res.writeHead(400, cors);
    res.end(result);
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: getSystemPrompt(),
    messages: result,
  });

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
    // Stream already started — can't change status code, just end
    res.end();
    throw err;
  }

  res.end();
}
