import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { HealthScore, StartupAnalysis, PersonasOutput, MvpScope, Roadmap } from '@/types';

const USER_PROMPT_TEMPLATE = `Evaluate the product plan and assign a readiness score from 0 to 100.

Score based on problem clarity, target audience specificity, MVP focus and scope discipline, and roadmap coherence. Output the score, key strengths, critical risks, and prioritized recommendations.

Return valid JSON only with the following schema:
{
  "score": 0,
  "strengths": ["string"],
  "risks": ["string"],
  "recommendations": ["string"]
}

Startup Analysis: {{startupAnalysis}}
Personas: {{personas}}
MVP Scope: {{mvpScope}}
Roadmap: {{roadmap}}`;

export async function generateHealthScore(
  startupAnalysis: StartupAnalysis,
  personas: PersonasOutput,
  mvpScope: MvpScope,
  roadmap: Roadmap
): Promise<HealthScore> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{startupAnalysis}}', JSON.stringify(startupAnalysis, null, 2))
    .replace('{{personas}}', JSON.stringify(personas, null, 2))
    .replace('{{mvpScope}}', JSON.stringify(mvpScope, null, 2))
    .replace('{{roadmap}}', JSON.stringify(roadmap, null, 2));

  return generateJson<HealthScore>(SYSTEM_PROMPT, prompt);
}
