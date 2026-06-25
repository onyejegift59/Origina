import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { Roadmap, MvpScope } from '@/types';

const USER_PROMPT_TEMPLATE = `Generate a phased product roadmap.

Phase 1: Core launch and initial validation. Phase 2: Iteration based on feedback. Phase 3: Growth and platform maturity. Each phase should contain 3-5 concrete initiatives. Reference the MVP scope.

Return valid JSON only with the following schema:
{
  "phase1": ["string"],
  "phase2": ["string"],
  "phase3": ["string"]
}

Idea: {{idea}}
MVP Scope: {{mvpScope}}`;

export async function generateRoadmap(
  idea: string,
  mvpScope: MvpScope
): Promise<Roadmap> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{idea}}', idea)
    .replace('{{mvpScope}}', JSON.stringify(mvpScope, null, 2));

  return generateJson<Roadmap>(SYSTEM_PROMPT, prompt);
}
