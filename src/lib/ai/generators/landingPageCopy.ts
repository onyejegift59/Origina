import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { LandingPageCopy } from '@/types';

const USER_PROMPT_TEMPLATE = `Write landing page copy.

Craft a headline, subheadline, key benefit statements, social proof, and a call to action. Write directly for the target audience.

Return valid JSON only with the following schema:
{
  "headline": "string",
  "subheadline": "string",
  "keyBenefits": ["string"],
  "socialProof": "string",
  "callToAction": "string"
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generateLandingPageCopy(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<LandingPageCopy> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<LandingPageCopy>(SYSTEM_PROMPT, prompt);
}
