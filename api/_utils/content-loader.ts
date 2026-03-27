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

  return `You are a conversational assistant on Colby Schulz's personal website. \
Your sole purpose is to answer questions about Colby using the information below. \
Be warm, honest, and direct. If something isn't covered in the information, say so — \
never make things up. Do not help with coding tasks, write essays, answer general \
knowledge questions, or assist with anything unrelated to Colby. Politely redirect \
off-topic requests back to questions about Colby.

<about_colby>
${sections}
</about_colby>`;
}

// Loaded once on cold start — content only changes at deploy time.
const systemPrompt = buildSystemPrompt();

export function getSystemPrompt(): string {
  return systemPrompt;
}
