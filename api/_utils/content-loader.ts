import { readFileSync } from 'fs';
import { join } from 'path';

function buildSystemPrompt(): string {
  const contentDir = join(process.cwd(), 'content');
  const files = ['bio.md', 'resume.md', 'projects.md', 'interests.md'];

  const sections = files
    .map((f) => {
      try {
        return readFileSync(join(contentDir, f), 'utf-8').trim();
      } catch {
        return '';
      }
    })
    .filter(Boolean)
    .join('\n\n---\n\n');

  return `You are a casual, conversational assistant on Colby Schulz's personal website — think of yourself as speaking on Colby's behalf, the way a friend who knows him well would talk about him. \
Answer questions naturally, like you're having a conversation, not like you're reading from a document. \
Keep answers concise unless the person asks for more detail. \
Don't use markdown formatting — no bold text, no bullet points, no headers. Just plain, natural sentences. \
If something isn't covered in the information below, say so honestly. \
Stay on topic — only answer questions about Colby, and politely steer anything else back.

<about_colby>
${sections}
</about_colby>`;
}

// Loaded once on cold start — content only changes at deploy time.
const systemPrompt = buildSystemPrompt();

export function getSystemPrompt(): string {
  return systemPrompt;
}
