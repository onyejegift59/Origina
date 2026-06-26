import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProject, getArtifact, upsertArtifact } from '@/lib/supabase/queries';
import { generateStartupAnalysis } from '@/lib/ai/generators/startupAnalysis';
import { generatePersonas } from '@/lib/ai/generators/personas';
import { generateMvpScope } from '@/lib/ai/generators/mvpScope';
import { generateRoadmap } from '@/lib/ai/generators/roadmap';
import { generateHealthScore } from '@/lib/ai/generators/healthScore';
import { generatePositioningStatement } from '@/lib/ai/generators/positioningStatement';
import { generateBrandStrategy } from '@/lib/ai/generators/brandStrategy';
import { generateValueProposition } from '@/lib/ai/generators/valueProposition';
import { generateUserJourney } from '@/lib/ai/generators/userJourney';
import { generateFeaturePrioritization } from '@/lib/ai/generators/featurePrioritization';
import { generateCompetitiveAnalysis } from '@/lib/ai/generators/competitiveAnalysis';
import { generateGoToMarketPlan } from '@/lib/ai/generators/goToMarketPlan';
import { generateLandingPageCopy } from '@/lib/ai/generators/landingPageCopy';
import { generateDesignDirection } from '@/lib/ai/generators/designDirection';
import { generateContentStrategy } from '@/lib/ai/generators/contentStrategy';
import { checkRateLimit } from '@/lib/ratelimit';
import { AI_RATE_LIMIT, ARTIFACT_LABELS } from '@/constants';
import type { ArtifactType, StartupAnalysis, MvpScope, Roadmap, PersonasOutput } from '@/types';

const generators: Record<string, (project: { name: string; idea: string; problem_description?: string | null }, projectId: string) => Promise<Record<string, unknown>>> = {
  startup_analysis: async (project) => {
    const result = await generateStartupAnalysis(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  personas: async (project) => {
    const result = await generatePersonas(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  mvp_scope: async (project, projectId) => {
    const analysis = await getArtifact(projectId, 'startup_analysis');
    const result = await generateMvpScope(project.idea, (analysis?.content || {}) as unknown as StartupAnalysis);
    return result as unknown as Record<string, unknown>;
  },
  roadmap: async (project, projectId) => {
    const mvpScope = await getArtifact(projectId, 'mvp_scope');
    const result = await generateRoadmap(project.idea, (mvpScope?.content || {}) as unknown as MvpScope);
    return result as unknown as Record<string, unknown>;
  },
  health_score: async (_project, projectId) => {
    const analysis = await getArtifact(projectId, 'startup_analysis');
    const personas = await getArtifact(projectId, 'personas');
    const mvpScope = await getArtifact(projectId, 'mvp_scope');
    const roadmap = await getArtifact(projectId, 'roadmap');
    const result = await generateHealthScore(
      (analysis?.content || {}) as unknown as StartupAnalysis,
      (personas?.content || { personas: [] }) as unknown as PersonasOutput,
      (mvpScope?.content || {}) as unknown as MvpScope,
      (roadmap?.content || {}) as unknown as Roadmap
    );
    return result as unknown as Record<string, unknown>;
  },
  positioning_statement: async (project) => {
    const result = await generatePositioningStatement(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  brand_strategy: async (project) => {
    const result = await generateBrandStrategy(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  value_proposition: async (project) => {
    const result = await generateValueProposition(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  user_journey: async (project) => {
    const result = await generateUserJourney(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  feature_prioritization: async (project) => {
    const result = await generateFeaturePrioritization(project.name, project.idea);
    return result as unknown as Record<string, unknown>;
  },
  competitive_analysis: async (project) => {
    const result = await generateCompetitiveAnalysis(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  gtm_plan: async (project) => {
    const result = await generateGoToMarketPlan(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  landing_page_copy: async (project) => {
    const result = await generateLandingPageCopy(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  design_direction: async (project) => {
    const result = await generateDesignDirection(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
  content_strategy: async (project) => {
    const result = await generateContentStrategy(project.name, project.idea, project.problem_description ?? undefined);
    return result as unknown as Record<string, unknown>;
  },
};

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
  const { projectId, type, regenerate } = body;

  if (!projectId || !type) {
    return NextResponse.json(
      { success: false, error: { message: 'Project ID and type are required' } },
      { status: 400 }
    );
  }

  if (!generators[type]) {
    return NextResponse.json(
      { success: false, error: { message: `Unknown artifact type: ${type}` } },
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

  if (!regenerate) {
    const existing = await getArtifact(projectId, type as ArtifactType);
    if (existing) {
      return NextResponse.json({ success: true, data: existing.content });
    }
  }

  try {
    const generator = generators[type];
    const raw = await generator(project, projectId);
    const { validateArtifact } = await import('@/lib/ai/schemas');
    const validation = validateArtifact(type, raw);
    if (!validation.valid) {
      console.error(`[generate] ${validation.error}`);
      return NextResponse.json(
        { success: false, error: { message: `Generated ${ARTIFACT_LABELS[type] || type} failed validation. Regenerating may help.` } },
        { status: 500 }
      );
    }
    const saved = await upsertArtifact(projectId, type as ArtifactType, validation.data as Record<string, unknown>);

    return NextResponse.json({ success: true, data: saved?.content ?? validation.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[generate] Failed to generate ${type}:`, message);
    return NextResponse.json(
      { success: false, error: { message: `Unable to generate ${ARTIFACT_LABELS[type] || type}.` } },
      { status: 500 }
    );
  }
}
