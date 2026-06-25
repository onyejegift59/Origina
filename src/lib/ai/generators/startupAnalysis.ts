import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { StartupAnalysis } from '@/types';

const USER_PROMPT_TEMPLATE = `Write a startup analysis.

Cover the problem the product addresses, the target user segment, the benefit it offers, the market context that makes this viable, key execution risks, and actionable next steps.

Return valid JSON only with the following schema:
{
  "problemStatement": "string",
  "targetAudience": "string",
  "valueProposition": "string",
  "marketOpportunity": "string",
  "risks": ["string"],
  "recommendations": ["string"]
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}`;

export async function generateStartupAnalysis(
  projectName: string,
  idea: string,
  targetAudience?: string
): Promise<StartupAnalysis> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified');

  return generateJson<StartupAnalysis>(SYSTEM_PROMPT, prompt);
}
