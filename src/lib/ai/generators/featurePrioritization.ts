import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { FeaturePrioritization } from '@/types';

const USER_PROMPT_TEMPLATE = `Prioritize features using a structured framework.

Specify the framework (RICE, MoSCoW, or other). List each feature with its name, impact, effort, strategic value, and category.

Return valid JSON only with the following schema:
{
  "framework": "string",
  "features": [
    {
      "name": "string",
      "impact": "string",
      "effort": "string",
      "strategicValue": "string",
      "category": "string"
    }
  ]
}

Project Name: {{projectName}}
Idea: {{idea}}
Existing Context: {{context}}`;

export async function generateFeaturePrioritization(
  projectName: string,
  idea: string,
  context?: string
): Promise<FeaturePrioritization> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{context}}', context || 'None');

  return generateJson<FeaturePrioritization>(SYSTEM_PROMPT, prompt);
}
