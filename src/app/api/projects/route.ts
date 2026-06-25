import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProjects, createProject } from '@/lib/supabase/queries';
import { INPUT_LIMITS, validateLength } from '@/lib/security';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication failed.' } },
      { status: 401 }
    );
  }

  const projects = await getProjects(authData.user.id);
  return NextResponse.json({ success: true, data: projects });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication failed.' } },
      { status: 401 }
    );
  }

  const user = authData.user;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body.' } },
      { status: 400 }
    );
  }

  const { name, idea, problem_description } = body;

  if (!name || !idea) {
    return NextResponse.json(
      { success: false, error: { message: 'Project name and idea are required.' } },
      { status: 400 }
    );
  }

  const nameError = validateLength(name, 'Project name', INPUT_LIMITS.projectName.maxLength);
  if (nameError) {
    return NextResponse.json(
      { success: false, error: { message: nameError } },
      { status: 400 }
    );
  }

  const ideaError = validateLength(idea, 'Idea', INPUT_LIMITS.idea.maxLength);
  if (ideaError) {
    return NextResponse.json(
      { success: false, error: { message: ideaError } },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { error: profileError } = await admin.from('profiles').upsert(
      { id: user.id, email: user.email ?? '' },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (profileError) {
      console.error('[projects] Profile upsert failed:', profileError.message);
    }
  } catch (err) {
    console.error('[projects] Profile upsert error:', err);
  }

  const result = await createProject(
    user.id,
    name,
    idea,
    problem_description || ''
  );

  if (!result.data || result.error) {
    console.error('[projects] createProject failed:', result.error);
    return NextResponse.json(
      { success: false, error: { message: result.error || 'Failed to create project.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
