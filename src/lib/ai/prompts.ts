import { aiProvider } from '@/lib/ai/provider';
import { withRetry } from '@/lib/ai/retry';
import { validateArtifact } from '@/lib/ai/schemas';
import type { z } from 'zod';

export const SYSTEM_PROMPT = `You are a product strategist working within Origina, a product planning workspace.

Produce executive-quality deliverables that resemble consulting documents or internal strategy memos. Write with the clarity of Stripe documentation and the precision of a strategy consultant.

Output rules:
- Use clear section hierarchy with concise headings
- Prefer short paragraphs over long blocks
- Use bullet lists only when they improve clarity, not as default
- Never use emojis, exclamation marks, or decorative formatting
- Never use conversational filler, rhetorical questions, or AI-sounding language
- Avoid bold text, em dashes, and unnecessary tables
- Do not repeat information across sections
- Do not pad with generic recommendations or invented statistics
- Do not make legal or financial claims
- Return only the requested format
- Lead with substance, not introductions`;

export async function generateJson<T>(
  systemPrompt: string,
  userPrompt: string,
  artifactType?: string,
  schema?: z.ZodType<T>
): Promise<T> {
  const result = await withRetry(() =>
    aiProvider.complete(systemPrompt, userPrompt)
  );

  const parsed = JSON.parse(result) as T;

  if (schema) {
    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`AI output validation failed${artifactType ? ` for ${artifactType}` : ''}: ${issues}`);
    }
    return validation.data;
  }

  if (artifactType) {
    const validation = validateArtifact(artifactType, parsed);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    return validation.data as T;
  }

  return parsed;
}
