export interface Project {
  id: string;
  user_id: string;
  name: string;
  idea: string;
  problem_description: string;
  created_at: string;
  updated_at: string;
}

export type ArtifactType =
  | 'startup_analysis'
  | 'personas'
  | 'mvp_scope'
  | 'roadmap'
  | 'health_score'
  | 'positioning_statement'
  | 'brand_strategy'
  | 'value_proposition'
  | 'user_journey'
  | 'feature_prioritization'
  | 'competitive_analysis'
  | 'gtm_plan'
  | 'landing_page_copy'
  | 'design_direction'
  | 'content_strategy';

export interface ProjectOutput {
  id: string;
  project_id: string;
  type: ArtifactType;
  content: Record<string, unknown>;
  version: number;
  created_at: string;
}

export interface AiConversation {
  id: string;
  project_id: string;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export interface Export {
  id: string;
  project_id: string;
  format: 'pdf' | 'docx' | 'md' | 'pptx';
  storage_url: string;
  created_at: string;
}

export interface StartupAnalysis {
  problemStatement: string;
  targetAudience: string;
  valueProposition: string;
  marketOpportunity: string;
  risks: string[];
  recommendations: string[];
}

export interface PersonasOutput {
  personas: Array<{
    name: string;
    role: string;
    goals: string[];
    painPoints: string[];
    motivations: string[];
  }>;
}

export interface MvpScope {
  mustHave: string[];
  shouldHave: string[];
  couldHave: string[];
  excludedFeatures: string[];
}

export interface Roadmap {
  phase1: string[];
  phase2: string[];
  phase3: string[];
}

export interface HealthScore {
  score: number;
  strengths: string[];
  risks: string[];
  recommendations: string[];
}

export interface PositioningStatement {
  targetMarket: string;
  category: string;
  uniqueDifferentiator: string;
  reasonToBelieve: string;
}

export interface BrandStrategy {
  brandPersonality: string;
  brandVoice: string;
  visualDirection: string;
  messagingPillars: string[];
}

export interface ValueProposition {
  primaryBenefit: string;
  keyDifferentiators: string[];
  competitiveRationale: string;
}

export interface UserJourney {
  stages: Array<{
    stage: string;
    touchpoints: string[];
    emotions: string;
    painPoints: string[];
    opportunities: string[];
  }>;
}

export interface FeaturePrioritization {
  framework: string;
  features: Array<{
    name: string;
    impact: string;
    effort: string;
    strategicValue: string;
    category: string;
  }>;
}

export interface CompetitiveAnalysis {
  competitors: Array<{
    name: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  differentiationOpportunities: string[];
}

export interface GoToMarketPlan {
  launchStrategy: string;
  targetChannels: string[];
  messaging: string;
  first90DayMetrics: string[];
}

export interface LandingPageCopy {
  headline: string;
  subheadline: string;
  keyBenefits: string[];
  socialProof: string;
  callToAction: string;
}

export interface DesignDirection {
  layoutPrinciples: string;
  typography: string;
  colorPalette: string;
  interactionPatterns: string;
}

export interface ContentStrategy {
  contentTypes: string[];
  tone: string;
  distributionChannels: string[];
  publishingCadence: string;
}


