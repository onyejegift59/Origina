import { z } from 'zod';

export const startupAnalysisSchema = z.object({
  problemStatement: z.string().min(1),
  targetAudience: z.string().min(1),
  valueProposition: z.string().min(1),
  marketOpportunity: z.string().min(1),
  risks: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
});

export const personasSchema = z.object({
  personas: z.array(z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    goals: z.array(z.string().min(1)),
    painPoints: z.array(z.string().min(1)),
    motivations: z.array(z.string().min(1)),
  })).min(1),
});

export const mvpScopeSchema = z.object({
  mustHave: z.array(z.string().min(1)),
  shouldHave: z.array(z.string().min(1)),
  couldHave: z.array(z.string().min(1)),
  excludedFeatures: z.array(z.string().min(1)),
});

export const roadmapSchema = z.object({
  phase1: z.array(z.string().min(1)),
  phase2: z.array(z.string().min(1)),
  phase3: z.array(z.string().min(1)),
});

export const healthScoreSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
});

export const positioningStatementSchema = z.object({
  targetMarket: z.string().min(1),
  category: z.string().min(1),
  uniqueDifferentiator: z.string().min(1),
  reasonToBelieve: z.string().min(1),
});

export const brandStrategySchema = z.object({
  brandPersonality: z.string().min(1),
  brandVoice: z.string().min(1),
  visualDirection: z.string().min(1),
  messagingPillars: z.array(z.string().min(1)),
});

export const valuePropositionSchema = z.object({
  primaryBenefit: z.string().min(1),
  keyDifferentiators: z.array(z.string().min(1)),
  competitiveRationale: z.string().min(1),
});

export const userJourneySchema = z.object({
  stages: z.array(z.object({
    stage: z.string().min(1),
    touchpoints: z.array(z.string()),
    emotions: z.string().min(1),
    painPoints: z.array(z.string()),
    opportunities: z.array(z.string()),
  })).min(1),
});

export const featurePrioritizationSchema = z.object({
  framework: z.string().min(1),
  features: z.array(z.object({
    name: z.string().min(1),
    impact: z.string().min(1),
    effort: z.string().min(1),
    strategicValue: z.string().min(1),
    category: z.string().min(1),
  })).min(1),
});

export const competitiveAnalysisSchema = z.object({
  competitors: z.array(z.object({
    name: z.string().min(1),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
  })).min(1),
  differentiationOpportunities: z.array(z.string().min(1)),
});

export const goToMarketPlanSchema = z.object({
  launchStrategy: z.string().min(1),
  targetChannels: z.array(z.string().min(1)),
  messaging: z.string().min(1),
  first90DayMetrics: z.array(z.string().min(1)),
});

export const landingPageCopySchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  keyBenefits: z.array(z.string().min(1)),
  socialProof: z.string().min(1),
  callToAction: z.string().min(1),
});

export const designDirectionSchema = z.object({
  layoutPrinciples: z.string().min(1),
  typography: z.string().min(1),
  colorPalette: z.string().min(1),
  interactionPatterns: z.string().min(1),
});

export const contentStrategySchema = z.object({
  contentTypes: z.array(z.string().min(1)),
  tone: z.string().min(1),
  distributionChannels: z.array(z.string().min(1)),
  publishingCadence: z.string().min(1),
});

export const artifactSchemas: Record<string, z.ZodTypeAny> = {
  startup_analysis: startupAnalysisSchema,
  personas: personasSchema,
  mvp_scope: mvpScopeSchema,
  roadmap: roadmapSchema,
  health_score: healthScoreSchema,
  positioning_statement: positioningStatementSchema,
  brand_strategy: brandStrategySchema,
  value_proposition: valuePropositionSchema,
  user_journey: userJourneySchema,
  feature_prioritization: featurePrioritizationSchema,
  competitive_analysis: competitiveAnalysisSchema,
  gtm_plan: goToMarketPlanSchema,
  landing_page_copy: landingPageCopySchema,
  design_direction: designDirectionSchema,
  content_strategy: contentStrategySchema,
};

export function validateArtifact(type: string, data: unknown): { valid: true; data: unknown } | { valid: false; error: string } {
  const schema = artifactSchemas[type];
  if (!schema) {
    return { valid: false, error: `No schema found for artifact type: ${type}` };
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { valid: false, error: `Validation failed for ${type}: ${issues}` };
  }

  return { valid: true, data: result.data };
}
