import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { ValueProposition } from '@/types';

const USER_PROMPT_TEMPLATE = `Define the value proposition.

Identify the primary benefit the product delivers, the key differentiators that distinguish it from alternatives, and the competitive rationale for why customers will choose it.

Return valid JSON only with the following schema:
{
  "primaryBenefit": "string",
  "keyDifferentiators": ["string"],
  "competitiveRationale": "string"
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generateValueProposition(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<ValueProposition> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<ValueProposition>(SYSTEM_PROMPT, prompt);
}
