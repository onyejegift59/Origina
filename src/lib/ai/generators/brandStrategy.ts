import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { BrandStrategy } from '@/types';

const USER_PROMPT_TEMPLATE = `Define a brand strategy.

Cover brand personality, brand voice, visual direction, and core messaging pillars. Each messaging pillar is a distinct theme the brand consistently communicates.

Return valid JSON only with the following schema:
{
  "brandPersonality": "string",
  "brandVoice": "string",
  "visualDirection": "string",
  "messagingPillars": ["string"]
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generateBrandStrategy(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<BrandStrategy> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<BrandStrategy>(SYSTEM_PROMPT, prompt);
}
