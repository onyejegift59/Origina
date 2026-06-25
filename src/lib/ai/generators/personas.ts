import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { PersonasOutput } from '@/types';

const USER_PROMPT_TEMPLATE = `Define user personas.

Each persona represents a distinct user segment with realistic goals, frustrations, and motivations. Include name, role, primary goals, pain points with current alternatives, and motivations for adopting a new solution.

Produce 3 personas grounded in the project context. Do not invent demographic data without basis.

Return valid JSON only with the following schema:
{
  "personas": [
    {
      "name": "string",
      "role": "string",
      "goals": ["string"],
      "painPoints": ["string"],
      "motivations": ["string"]
    }
  ]
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}`;

export async function generatePersonas(
  projectName: string,
  idea: string,
  targetAudience?: string
): Promise<PersonasOutput> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified');

  return generateJson<PersonasOutput>(SYSTEM_PROMPT, prompt);
}
