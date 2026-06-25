import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { PositioningStatement } from '@/types';

const USER_PROMPT_TEMPLATE = `Write a positioning statement.

Define the target market, the competitive category, the unique differentiator, and the reason to believe that supports the claim.

Return valid JSON only with the following schema:
{
  "targetMarket": "string",
  "category": "string",
  "uniqueDifferentiator": "string",
  "reasonToBelieve": "string"
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generatePositioningStatement(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<PositioningStatement> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<PositioningStatement>(SYSTEM_PROMPT, prompt);
}
