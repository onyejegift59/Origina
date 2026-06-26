import { createServerSupabaseClient } from './server';
import type { Project, ProjectOutput, AiConversation, Export, ArtifactType } from '@/types';

export async function getProjects(userId: string, limit?: number): Promise<Project[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit ?? 100);

  return data ?? [];
}

export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  return data;
}

export async function createProject(
  userId: string,
  name: string,
  idea: string,
  problemDescription: string
): Promise<{ data: Project | null; error: string | null }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name,
      idea,
      problem_description: problemDescription,
    })
    .select()
    .single();

  if (error) {
    console.error('[createProject] Supabase insert failed:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<Pick<Project, 'name' | 'idea' | 'problem_description'>>
): Promise<Project | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  return data;
}

export async function deleteProject(projectId: string, userId: string): Promise<'deleted' | 'not_found' | 'error'> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) {
    console.error('[deleteProject] Error:', error.message);
    return 'error';
  }

  return data ? 'deleted' : 'not_found';
}

export async function getArtifact(
  projectId: string,
  artifactType: ArtifactType
): Promise<ProjectOutput | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('project_outputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('type', artifactType)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function getAllUserArtifacts(userId: string, limit?: number): Promise<(ProjectOutput & { project_name: string })[]> {
  const supabase = await createServerSupabaseClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', userId);

  const projectIds = projects?.map((p) => p.id) ?? [];
  if (projectIds.length === 0) return [];

  const { data: outputs } = await supabase
    .from('project_outputs')
    .select('*, projects!inner(name)')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })
    .limit(limit ?? 100);

  const projectMap = new Map(projects?.map((p) => [p.id, p.name]));
  return (outputs ?? []).map((o) => ({
    ...o,
    project_name: projectMap.get(o.project_id) ?? 'Unknown',
  }));
}

export async function getProjectArtifacts(projectId: string, limit?: number): Promise<ProjectOutput[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('project_outputs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit ?? 100);

  return data ?? [];
}

export async function upsertArtifact(
  projectId: string,
  artifactType: ArtifactType,
  content: Record<string, unknown>
): Promise<ProjectOutput | null> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('project_outputs')
    .upsert(
      {
        project_id: projectId,
        type: artifactType,
        content,
        version: 1,
      },
      {
        onConflict: 'project_id,type',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  return data;
}

export async function getConversation(
  projectId: string,
  limit?: number
): Promise<AiConversation[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(limit ?? 200);

  return data ?? [];
}

export async function addConversationMessage(
  projectId: string,
  role: 'user' | 'assistant',
  message: string
): Promise<AiConversation | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('ai_conversations')
    .insert({ project_id: projectId, role, message })
    .select()
    .single();

  return data;
}

export async function createExportRecord(
  projectId: string,
  format: string,
  storageUrl: string
): Promise<Export | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('exports')
    .insert({ project_id: projectId, format, storage_url: storageUrl })
    .select()
    .single();

  return data;
}
