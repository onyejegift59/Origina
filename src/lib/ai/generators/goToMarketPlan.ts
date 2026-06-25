import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { GoToMarketPlan } from '@/types';

const USER_PROMPT_TEMPLATE = `Create a go-to-market plan.

Define the launch strategy, target channels for distribution and promotion, key messaging, and success metrics for the first 90 days.

Return valid JSON only with the following schema:
{
  "launchStrategy": "string",
  "targetChannels": ["string"],
  "messaging": "string",
  "first90DayMetrics": ["string"]
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generateGoToMarketPlan(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<GoToMarketPlan> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<GoToMarketPlan>(SYSTEM_PROMPT, prompt);
}
