import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { UserJourney } from '@/types';

const USER_PROMPT_TEMPLATE = `Map the user journey from discovery through advocacy.

For each stage, identify key touchpoints, the user emotional state, points of friction, and opportunities to improve the experience.

Return valid JSON only with the following schema:
{
  "stages": [
    {
      "stage": "string",
      "touchpoints": ["string"],
      "emotions": "string",
      "painPoints": ["string"],
      "opportunities": ["string"]
    }
  ]
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generateUserJourney(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<UserJourney> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<UserJourney>(SYSTEM_PROMPT, prompt);
}
