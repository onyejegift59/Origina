import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { CompetitiveAnalysis } from '@/types';

const USER_PROMPT_TEMPLATE = `Conduct a competitive analysis.

Identify key competitors, their strengths and weaknesses, and opportunities for differentiation. Focus on direct and adjacent competitors.

Return valid JSON only with the following schema:
{
  "competitors": [
    {
      "name": "string",
      "strengths": ["string"],
      "weaknesses": ["string"]
    }
  ],
  "differentiationOpportunities": ["string"]
}

Project Name: {{projectName}}
Idea: {{idea}}
Target Audience: {{targetAudience}}
Existing Context: {{context}}`;

export async function generateCompetitiveAnalysis(
  projectName: string,
  idea: string,
  targetAudience?: string,
  context?: string
): Promise<CompetitiveAnalysis> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{projectName}}', projectName)
    .replace('{{idea}}', idea)
    .replace('{{targetAudience}}', targetAudience || 'Not specified')
    .replace('{{context}}', context || 'None');

  return generateJson<CompetitiveAnalysis>(SYSTEM_PROMPT, prompt);
}
