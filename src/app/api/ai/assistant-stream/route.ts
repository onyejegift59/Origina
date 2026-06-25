import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProject, getProjectArtifacts, addConversationMessage, upsertArtifact, getArtifact } from '@/lib/supabase/queries';
import { aiProvider } from '@/lib/ai/provider';
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
import { ASSISTANT_RATE_LIMIT, ARTIFACT_LABELS } from '@/constants';
import type { ArtifactType } from '@/types';

const SYSTEM_PROMPT = `You are Origina's product strategy assistant embedded in a product planning workspace.

Answer directly using the project context provided. Lead with the answer, not an introduction. Use short paragraphs. Use bullet lists only when they improve clarity. Maintain a calm, professional tone.

Style rules:
- No emojis, exclamation marks, decorative formatting, or bold text
- No conversational filler, rhetorical questions, or AI-sounding language
- No phrases like "Great question", "I'd recommend", "Here's what I found", "Would you like me to", "Based on the information provided"
- Do not repeat information across sections
- Do not pad with generic recommendations

Grounding:
- Stay within the provided project context
- Do not invent information, statistics, or unrelated startup ideas
- Do not make legal or financial claims`;

function detectArtifactType(message: string): ArtifactType | null {
  const lower = message.toLowerCase();

  const hasGenIntent = /\b(generate|create|make|build|produce|define|develop|write|draft|prepare)\b/i.test(lower);
  if (!hasGenIntent) return null;

  if (/(startup analysis|analyze (my|this|the) idea)/i.test(lower)) return 'startup_analysis';
  if (/personas|user persona/i.test(lower)) return 'personas';
  if (/\bmvp\b|minimum viable product|mvp scope/i.test(lower)) return 'mvp_scope';
  if (/roadmap|product roadmap/i.test(lower)) return 'roadmap';
  if (/health score|health check|readiness score/i.test(lower)) return 'health_score';
  if (/positioning statement/i.test(lower)) return 'positioning_statement';
  if (/brand strategy/i.test(lower)) return 'brand_strategy';
  if (/value proposition/i.test(lower)) return 'value_proposition';
  if (/user journey|customer journey/i.test(lower)) return 'user_journey';
  if (/feature prioritization|prioritize features|rice|moscow/i.test(lower)) return 'feature_prioritization';
  if (/competitive analysis|competitor analysis|competition/i.test(lower)) return 'competitive_analysis';
  if (/go.to.market|gtm plan|launch plan/i.test(lower)) return 'gtm_plan';
  if (/landing page copy|landing page/i.test(lower)) return 'landing_page_copy';
  if (/design direction|design system|ui direction/i.test(lower)) return 'design_direction';
  if (/content strategy/i.test(lower)) return 'content_strategy';

  return null;
}

async function generateArtifactForProject(
  type: ArtifactType,
  project: { name: string; idea: string; problem_description?: string | null },
  projectId: string
): Promise<string | null> {
  const label = ARTIFACT_LABELS[type] || type;

  try {
    switch (type) {
      case 'startup_analysis': {
        const result = await generateStartupAnalysis(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'personas': {
        const result = await generatePersonas(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'mvp_scope': {
        const analysis = await getArtifact(projectId, 'startup_analysis');
        if (!analysis) return 'A startup analysis is required before defining the MVP scope.';
        const result = await generateMvpScope(project.idea, analysis.content as any);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'roadmap': {
        const mvpScope = await getArtifact(projectId, 'mvp_scope');
        if (!mvpScope) return 'An MVP scope is required before building a roadmap.';
        const result = await generateRoadmap(project.idea, mvpScope.content as any);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'health_score': {
        const analysis = await getArtifact(projectId, 'startup_analysis');
        const personas = await getArtifact(projectId, 'personas');
        const mvpScope = await getArtifact(projectId, 'mvp_scope');
        const roadmap = await getArtifact(projectId, 'roadmap');
        const result = await generateHealthScore(
          (analysis?.content || {}) as any,
          (personas?.content || { personas: [] }) as any,
          (mvpScope?.content || {}) as any,
          (roadmap?.content || {}) as any
        );
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'positioning_statement': {
        const result = await generatePositioningStatement(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'brand_strategy': {
        const result = await generateBrandStrategy(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'value_proposition': {
        const result = await generateValueProposition(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'user_journey': {
        const result = await generateUserJourney(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'feature_prioritization': {
        const result = await generateFeaturePrioritization(project.name, project.idea);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'competitive_analysis': {
        const result = await generateCompetitiveAnalysis(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'gtm_plan': {
        const result = await generateGoToMarketPlan(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'landing_page_copy': {
        const result = await generateLandingPageCopy(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'design_direction': {
        const result = await generateDesignDirection(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
      case 'content_strategy': {
        const result = await generateContentStrategy(project.name, project.idea, project.problem_description ?? undefined);
        await upsertArtifact(projectId, type, result as unknown as Record<string, unknown>);
        return `${label} added to artifacts.`;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[assistant-stream] Failed to generate ${type}:`, message);
    return '';
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ success: false, error: { message: 'Unauthorized' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { allowed } = await checkRateLimit(`assistant:${user.id}`, ASSISTANT_RATE_LIMIT.requestsPerHour);
  if (!allowed) {
    return new Response(JSON.stringify({ success: false, error: { message: 'Rate limit exceeded.' } }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { projectId, message } = body;

  if (!projectId || !message) {
    return new Response(JSON.stringify({ success: false, error: { message: 'Project ID and message are required' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const project = await getProject(projectId, user.id);
  if (!project) {
    return new Response(JSON.stringify({ success: false, error: { message: 'Project not found' } }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await addConversationMessage(projectId, 'user', message);

  const detectedType = detectArtifactType(message);
  let generatedConfirmation: string | null = null;
  if (detectedType) {
    generatedConfirmation = await generateArtifactForProject(detectedType, project, projectId);
  }

  const artifacts = await getProjectArtifacts(projectId);
  const projectContext = JSON.stringify(
    {
      name: project.name,
      idea: project.idea,
      artifacts: artifacts.reduce((acc, a) => {
        acc[a.type] = a.content;
        return acc;
      }, {} as Record<string, unknown>),
    },
    null,
    2
  );

  const artifactNote = generatedConfirmation
    ? `\n\nNote: The following artifact was already generated based on this request:\n${generatedConfirmation}\nAcknowledge this briefly in your response.\n`
    : generatedConfirmation === '' ? `\n\nNote: The artifact generation failed due to an error. Inform the user that the generation was unsuccessful and suggest they try again.\n`
    : '';
  const userPrompt = `Project Context:\n${projectContext}${artifactNote}\n\nUser Message: ${message}`;

  if (!aiProvider.completeStream) {
    return new Response(JSON.stringify({ success: false, error: { message: 'Streaming not supported' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const stream = await aiProvider.completeStream(SYSTEM_PROMPT, userPrompt);

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let fullResponse = '';

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          } catch {
            // skip malformed chunks
          }
        }
      },

      async flush() {
        if (fullResponse) {
          try {
            await addConversationMessage(projectId, 'assistant', fullResponse);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('[assistant-stream] Failed to persist assistant message:', message);
          }
        }
      },
    });

    return new Response(stream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[assistant-stream] Stream error:', message);
    return new Response(JSON.stringify({ success: false, error: { message: 'Failed to generate response.' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
