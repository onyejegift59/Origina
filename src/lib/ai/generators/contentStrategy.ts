import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { ContentStrategy } from '@/types';

const USER_PROMPT_TEMPLATE = `Develop a content strategy.

Define content types, tone and voice, distribution channels, and a publishing cadence.

Return valid JSON only with the following schema:
{
  "contentTypes": ["string"],
  "tone": "string",
  "distributionChannels": ["string"],
  "publishingCadence": "string"
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generateContentStrategy(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<ContentStrategy> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<ContentStrategy>(SYSTEM_PROMPT, prompt);
}
