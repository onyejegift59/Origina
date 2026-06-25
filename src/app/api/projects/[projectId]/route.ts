import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProject, updateProject, deleteProject, getProjectArtifacts, getConversation } from '@/lib/supabase/queries';
import { INPUT_LIMITS, validateLength } from '@/lib/security';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication failed.' } },
      { status: 401 }
    );
  }

  const project = await getProject(projectId, user.id);
  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  const artifacts = await getProjectArtifacts(projectId);
  const conversation = await getConversation(projectId);

  return NextResponse.json({
    success: true,
    data: { ...project, artifacts, conversation },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication failed.' } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { name, idea, problem_description } = body;

  if (name !== undefined) {
    const nameError = validateLength(name, 'Project name', INPUT_LIMITS.projectName.maxLength);
    if (nameError) {
      return NextResponse.json(
        { success: false, error: { message: nameError } },
        { status: 400 }
      );
    }
  }

  if (idea !== undefined) {
    const ideaError = validateLength(idea, 'Idea', INPUT_LIMITS.idea.maxLength);
    if (ideaError) {
      return NextResponse.json(
        { success: false, error: { message: ideaError } },
        { status: 400 }
      );
    }
  }

  const project = await updateProject(projectId, user.id, {
    ...(name !== undefined && { name }),
    ...(idea !== undefined && { idea }),
    ...(problem_description !== undefined && { problem_description }),
  });

  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: project });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication failed.' } },
      { status: 401 }
    );
  }

  const result = await deleteProject(projectId, user.id);
  if (result === 'not_found') {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  if (result === 'error') {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete project.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
