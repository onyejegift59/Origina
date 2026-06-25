import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { DesignDirection } from '@/types';

const USER_PROMPT_TEMPLATE = `Recommend a design direction.

Cover layout principles and structural approach, typography, color palette, and key interaction patterns.

Return valid JSON only with the following schema:
{
  "layoutPrinciples": "string",
  "typography": "string",
  "colorPalette": "string",
  "interactionPatterns": "string"
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generateDesignDirection(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<DesignDirection> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<DesignDirection>(SYSTEM_PROMPT, prompt);
}
