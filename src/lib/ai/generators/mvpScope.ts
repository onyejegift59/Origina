import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { MvpScope, StartupAnalysis } from '@/types';

const USER_PROMPT_TEMPLATE = `Define the MVP scope.

Classify features into four categories: must have for initial launch, should have but not critical for v1, could have but can wait, and explicitly excluded from scope. Prioritize for maximum learning per unit of effort. Reference the startup analysis.

Return valid JSON only with the following schema:
{
  "mustHave": ["string"],
  "shouldHave": ["string"],
  "couldHave": ["string"],
  "excludedFeatures": ["string"]
}

Idea: {{idea}}
Startup Analysis: {{startupAnalysis}}`;

export async function generateMvpScope(
  idea: string,
  startupAnalysis: StartupAnalysis
): Promise<MvpScope> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{idea}}', idea)
    .replace('{{startupAnalysis}}', JSON.stringify(startupAnalysis, null, 2));

  return generateJson<MvpScope>(SYSTEM_PROMPT, prompt);
}
