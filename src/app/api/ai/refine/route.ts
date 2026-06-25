import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProject, upsertArtifact } from '@/lib/supabase/queries';
import { refineArtifact } from '@/lib/ai/generators/refine';
import { checkRateLimit } from '@/lib/ratelimit';
import { AI_RATE_LIMIT, ARTIFACT_TYPES } from '@/constants';
import { INPUT_LIMITS, validateLength } from '@/lib/security';
import { validateArtifact } from '@/lib/ai/schemas';
import type { ArtifactType } from '@/types';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const { allowed } = await checkRateLimit(`ai:${user.id}`, AI_RATE_LIMIT.requestsPerHour);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Rate limit exceeded. Please try again later.' } },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { projectId, artifactType, artifactContent, instruction } = body;

  if (!projectId || !artifactType || !artifactContent || !instruction) {
    return NextResponse.json(
      { success: false, error: { message: 'Missing required fields' } },
      { status: 400 }
    );
  }

  if (!ARTIFACT_TYPES.includes(artifactType)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid artifact type.' } },
      { status: 400 }
    );
  }

  const instructionError = validateLength(instruction, 'Instruction', INPUT_LIMITS.refineInstruction.maxLength);
  if (instructionError) {
    return NextResponse.json(
      { success: false, error: { message: instructionError } },
      { status: 400 }
    );
  }

  const project = await getProject(projectId, user.id);
  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  try {
    const refined = await refineArtifact(
      artifactType as ArtifactType,
      artifactContent,
      instruction
    );

    const validation = validateArtifact(artifactType as string, refined);
    if (!validation.valid) {
      console.error(`[refine] ${validation.error}`);
      return NextResponse.json(
        { success: false, error: { message: 'Refinement failed validation. Please try again.' } },
        { status: 500 }
      );
    }

    const saved = await upsertArtifact(projectId, artifactType as ArtifactType, validation.data as Record<string, unknown>);

    return NextResponse.json({ success: true, data: saved?.content ?? validation.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[refine] Failed:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Unable to refine artifact.' } },
      { status: 500 }
    );
  }
}
