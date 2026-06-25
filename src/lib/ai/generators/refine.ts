import { SYSTEM_PROMPT, generateJson } from '@/lib/ai/prompts';
import type { ArtifactType } from '@/types';

const USER_PROMPT_TEMPLATE = `Refine the artifact below.

Preserve existing content that remains relevant. Apply the requested changes while maintaining the same JSON schema.

Return valid JSON only.

Artifact Type: {{artifactType}}
Current Content: {{artifactContent}}
User Instruction: {{instruction}}`;

export async function refineArtifact(
  artifactType: ArtifactType,
  artifactContent: Record<string, unknown>,
  instruction: string
): Promise<Record<string, unknown>> {
  const prompt = USER_PROMPT_TEMPLATE
    .replace('{{artifactType}}', artifactType)
    .replace('{{artifactContent}}', JSON.stringify(artifactContent, null, 2))
    .replace('{{instruction}}', instruction);

  return generateJson<Record<string, unknown>>(SYSTEM_PROMPT, prompt);
}
